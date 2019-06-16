import * as puppeteer from 'puppeteer'
import { join } from 'path'
import config from '../config';
const moment = require('moment-timezone')

export const launch = async (proxy?: string): Promise<{page: puppeteer.Page, browser: puppeteer.Browser}> => {
    const browser = await puppeteer.launch({
       args: [
           '--no-sandbox',
           '--disable-dev-shm-usage',
           '--disable-setuid-sandbox',
           '--lang=zh-CN'
        ].concat(proxy ? [`--proxy-server=${proxy}`] : []),
       headless: config.headless,
       userDataDir:  join(config.rootPath, 'user_data'),
       executablePath: config.chromePath,
       timeout: 60000,

   })

   const page = await browser.newPage()
   await page.setViewport({ width: 320, height: 568 })
   await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1')

   return { page, browser }
}

export const screenshot = async (page: puppeteer.Page, type: string) => {
   try {
      page && await page.screenshot({path: join(config.rootPath, 'screenshot', `${type}_` + moment().format('YYYYMMDDHHmmss') + '.png')})
   } catch (error) {
      console.error('截图错误', error)
   }
}
