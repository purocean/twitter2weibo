import { Page } from 'puppeteer'
import { sleep, log } from './utils'
import config from '../config'

const isLoginPage = (page: Page) => {
    return page.url().startsWith('https://passport.weibo.cn/signin/login')
}

const login = async (page: Page, navigationPromise: Promise<any>) => {
    log('登录失效，尝试登录微博')

    const username = config.weibo.username
    const password =  config.weibo.password

    await page.waitForSelector('#loginName')
    await page.waitForSelector('#loginPassword')
    await page.waitForSelector('#loginAction')
    await page.$eval('#loginName', (e: any, val: string) => e.value = val, username)
    await page.$eval('#loginPassword', (e: any, val: string) => e.value = val, password)
    await sleep(2000)
    await page.click('#loginAction')
    await navigationPromise
    await sleep(10000)

    if (isLoginPage(page)) {
        const message = await page.evaluate(() => {
            const err = document.getElementById('errorMsg')

            if (err && err.style.display === 'block') {
                return err.innerText
            } else {
                return null
            }
        })

        log('登录失败', message)
        throw `微博登录失败：${message}`
    }
}

const doSend = async (page: Page, navigationPromise: Promise<any>, text: string, imgs: string[] = []) => {
    const url = 'https://m.weibo.cn/compose/'
    if (!page.url().startsWith(url)) {
        page.goto(url)
    }

    await navigationPromise

    log('填写文字', text)
    const inputSelector = '#app > div.m-wrapper.m-wbox > div > main > div.m-box-model.m-pos-r > div > span > textarea:nth-child(1)'
    await page.waitForSelector(inputSelector)
    await page.$eval(inputSelector, (e: any, val: string) => {
        e.value = val
        e.dispatchEvent(new Event('input'))
    }, text)
    await sleep(1500)

    if (imgs.length > 0) {
        log('添加图片', imgs)
        const fileSelector = '#selectphoto'
        await page.waitForSelector(fileSelector)
        const file = await page.$(fileSelector)

        const objectId = (file as any)._remoteObject.objectId
        const client = (file as any)._client
        await client.send('DOM.setFileInputFiles', { objectId, files: imgs });

        // await file.uploadFile(...imgs)
        await page.waitForNavigation({waitUntil: 'networkidle0'})
        await sleep(10000)
    }

    log('点击发送按钮')
    const buttonSelector = '#app > div.m-wrapper.m-wbox > div > header > div.m-box.m-flex-grow1.m-box-model.m-fd-row.m-aln-center.m-justify-end.m-flex-base0 > a'
    await page.waitForSelector(buttonSelector)
    await page.click(buttonSelector)

    await sleep(5000)

    if (page.url().startsWith(url)) {
        throw '微博发布失败'
    } else {
        log('发布成功')
    }
}

export const send = async (page: Page, text: string, imgs: string[] = []): Promise<Page> => {
    log('发微博', [text, imgs])
    const navigationPromise = page.waitForNavigation({waitUntil: 'networkidle0'})

    log('进入微博首页，点击发布')
    await page.goto('https://m.weibo.cn/')
    await navigationPromise

    page.evaluate(() => localStorage.removeItem('H5_MBLOG_SAVE_CONTENT'))

    await page.waitForSelector('#app > div.main-wrap > div.lite-topbar.main-top > div.nav-top > div.nav-right > div.lite-iconf-releas')
    await page.click('#app > div.main-wrap > div.lite-topbar.main-top > div.nav-top > div.nav-right > div.lite-iconf-releas')
    await navigationPromise
    await sleep(1000)

    if (isLoginPage(page)) {
        await login(page, navigationPromise)
    }

    await doSend(page, navigationPromise, text, imgs)

    return page
}