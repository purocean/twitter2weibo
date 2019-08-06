import { launch, screenshot } from './browser'
import * as weibo from './weibo'
import * as twitter from './twitter'
import { log, downloadFile } from './utils'
import { record, check } from './record'
import config from '../config'
import { join, resolve, relative, dirname } from 'path';
import { toWslPath, isWsl, toWinPath } from './wsl';
import { translate } from './translate';
const moment = require('moment-timezone')

const loop = async () => {
    log('------------------------------------------------')
    // 抓取推特
    let browser = null
    let data: twitter.Post[] = []
    try {
        browser = await launch(config.proxy)
        data = await twitter.fetch(browser.page)
        console.log('抓取到数据', data.length)
    } catch (error) {
        console.error('推特抓取错误：', error)
        browser && screenshot(browser.page, 'twitter')
    } finally {
        browser && await browser.browser.close()
        browser = null
    }

    // console.log(data);
    // process.exit()

    // 发送微博
    try {
        browser = await launch(config.proxy)

        for (let i = 0; i < data.length; i++) {
            const item = data[i]

            const id = item.time
            if (check(id)) {
                log('此条已发，跳过', id)
                continue
            }

            const format = async (item: twitter.Post, t: boolean) => {
                const str = item.content.replace(/(#\S+)(\s|$)/g, '$1#')
                const chinese = t ? await translate(str) : ''
                const content = (chinese ? chinese + '\n------------\n' : '') + str

                let text = '#川普推特搬运# ' + moment(item.time).tz('America/New_York').format('YYYY-MM-DD HH:mm:ssZ') + '\n'
                     + content + '\n'
                if (item.quote) {
                    const str = item.quote.content.replace(/(#\S+)(\s|$)/g, '$1#')
                    const chinese = await translate(str)
                    const content = (chinese ? chinese + '\n------------\n' : '') + str

                    text += '\n引用> '
                    text +=  item.quote.user + ' | ' + moment(item.quote.time).tz('America/New_York').format('YYYY-MM-DD HH:mm:ssZ') + '\n'
                    text +=  content
                }

                return text.substr(0, 2000)
            }

            try {
                const imgs = await Promise.all(item.pics.map(async (pic, i) => {
                    const path = join(config.rootPath, 'images', moment(item.time).tz('America/New_York').format('YYYYMMDDHHmmss') + '_' + i + '.jpg')
                    await downloadFile(pic.replace(/(name=(.*\&|.*$))/, 'name=medium'), isWsl ? toWslPath(path) : path, config.proxy)
                    return path
                }))
                await weibo.send(browser.page, await format(item, true), imgs)
                record(item.time)
            } catch (error) {
                if (error && error.type === 'illegal' && error.sp) {
                    await weibo.send(browser.page, '#川普推特搬运# ' + moment(item.time).tz('America/New_York').format('YYYY-MM-DD HH:mm:ssZ'), [error.sp])
                    record(item.time)
                } else {
                    console.error('微博发送错误：', error)

                    await weibo.send(browser.page, await format(item, false), [])
                    record(item.time)
                }
            }
        }
    } catch (error) {
        console.error(error)
    } finally {
        browser && await browser.browser.close()
        browser = null
    }
}

export const main = async () => {
    const tmp = async () => {
        setTimeout(async () => {
            await loop()
            tmp()
        }, 10 * 60 * 1000) // 10 分钟检查一次
    }

    await loop()
    tmp()

    //const browser = await launch(config.proxy)
    //await browser.page.goto('https://m.weibo.cn/')
}
