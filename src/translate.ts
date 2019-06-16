import * as request from 'request'
import config from '../config';

export const translate = (text: string): Promise<string> => {
    const url = 'http://translate.google.cn/translate_a/single?client=at&sl=en&tl=zh-CN&dt=t&q=' + encodeURIComponent(text)
    return new Promise((resolve, reject) => {
        request(url, {proxy: config.proxy}, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                const data = JSON.parse(body)
                const str = (data[0] || []).map((x: any) => {
                    return x[0] || ''
                }).join(' ')
                resolve(str)
            } else {
                console.error('翻译失败', url, error)
                resolve('')
            }
        })
    })
}
