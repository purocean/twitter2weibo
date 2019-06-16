import { writeFile, readFileSync, createWriteStream, existsSync, unlinkSync, mkdirSync } from 'fs'
import * as path from 'path'
import * as request from 'request'

export const sleep = (time: number) => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, time)
    })
}

export const log = (message: string, data: any = '') => {
    const time = new Date().toLocaleDateString() + ' ' + new Date().toString().match(/\d\d:\d\d:\d\d/)[0]

    console.log(`[${time}] ${message}`, data)
}

export const writeJson = (fileName: string, data: any, call = () => {}) => {
    writeFile(fileName, JSON.stringify(data, undefined, 2), 'utf8', call);
}

export const readJson = (fileName: string) => {
    try {
        const data = readFileSync(fileName)
        return JSON.parse(data.toString())
    } catch (error) {
        return null
    }
}

export const mkdirPSync = (location: string) => {
    let normalizedPath = path.normalize(location)
    let parsedPathObj = path.parse(normalizedPath)
    let curDir = parsedPathObj.root
    let folders = parsedPathObj.dir.split(path.sep)
    folders.push(parsedPathObj.base)
    for(let part of folders) {
        if (part.indexOf(':') > -1) { // 修复 Windows 下面路径错误
            continue
        }

        curDir = path.join(curDir, part)
        if (!existsSync(curDir)) {
            mkdirSync(curDir)
        }
    }
}

export const downloadFile = (url: string, location: string, proxy?: string): Promise<string> => {
    if (!existsSync(path.dirname(location))) {
        mkdirPSync(path.dirname(location))
    }

    const stream = createWriteStream(location)

    return new Promise((resolve, reject) => {
        request(url, {proxy}).on('error', err => {
            if (existsSync(location)) {
                unlinkSync(location)
            }
            reject(err)
        }).pipe(stream).on('close', () => {
            resolve(location)
        })
    })
}
