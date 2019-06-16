import { resolve } from "path";
import { readJson, writeJson } from "./utils";

const fileName = resolve(__dirname, '../record.json')

export const check = (id: string): boolean => {
    const json = readJson(fileName) || {}

    return !!json[id]
}

export const record = (id: string) => {
    const json = readJson(fileName) || {}

    json[id] = true

    writeJson(fileName, json)
}
