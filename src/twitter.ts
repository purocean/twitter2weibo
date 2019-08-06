import { Page } from 'puppeteer'
import { sleep, log } from './utils'

export interface Post {
    content: string
    time: string
    pics: string[]
    quote?: {
        user: string
        time: string
        content: string
    }
}

export const fetch = async (page: Page): Promise<Post[]> => {
    log('抓取推特')
    const navigationPromise = page.waitForNavigation({waitUntil: 'networkidle0'})
    page.goto('https://mobile.twitter.com/realDonaldTrump')
    await navigationPromise

    const selector = 'article'
    await page.waitForSelector('article')
    const data: Post[] = []
    for (let j = 0; j < 4; j++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight))
        await sleep(2000)
        const list = await page.$$eval(selector, (nodes: Element[]) => {
            return nodes.filter(x => x.textContent.indexOf('转推了') === -1 && x.textContent.indexOf('置顶推文') === -1).map(x => {
                try {
                    const content = (x.children.item(0).children.item(1).children.item(1).children.item(1) as HTMLElement).innerText
                    const time = x.querySelector('time').dateTime
                    const pics = [...x.children.item(0).children.item(1).children.item(1).querySelectorAll('img')].map(img => img.src)

                    if (content.indexOf('次查看') > -1) {
                        return null
                    }

                    const qe = x.querySelector('[role=blockquote]')
                    if (qe) {
                        const qu = (qe.querySelectorAll('[dir=ltr]')[0] as HTMLElement).innerText
                        const qt = qe.querySelector('time').dateTime
                        const qc = (qe.children.item(0).children.item(1) as HTMLElement).innerText
                        const pics = [...x.children.item(0).querySelectorAll('img')].map(img => img.src).filter(src => {
                            return !src.endsWith('.svg') && src.indexOf('profile_images') === -1
                        })
                        return {content, time, pics, quote: { user: qu, time: qt, content: qc }}
                    }

                    return { content, time, pics }
                } catch (error) {
                    throw error
                    // return {content: (x as HTMLElement).innerText, time: '', pics: []}
                }
            }).filter(k => !!k).reverse()
        })

        list.forEach(item => {
            if (!data.find(w => (w.time && w.time === item.time) || w.content === item.content)) {
                data.push(item)
            }
        })
    }

    return data
}
