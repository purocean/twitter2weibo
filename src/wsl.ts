const cp = require('child_process');
export const isWsl = require('is-wsl')

export const toWslPath = (path: string) => {
    return cp.execFileSync('wslpath', ['-u', `${path.replace(/\\/g, '/')}`]).toString().trim()
}

export const toWinPath = (path: string) => {
    return cp.execFileSync('wslpath', ['-w', path]).toString().trim()
}

export const getWinTempPath = () => {
    return cp.execFileSync('cmd.exe', ['/c', 'echo %temp%']).toString().trim()
}
