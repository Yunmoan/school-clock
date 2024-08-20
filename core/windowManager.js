const { BrowserWindow } = require('electron');
const path = require('path');

let windows = {}; // 用于跟踪已创建的窗口

function createWindow(file, windowName, options = {}) {
    const win = new BrowserWindow({
        ...options,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.loadFile(path.join(__dirname, '../pages', file));

    // 将窗口添加到跟踪列表
    windows[windowName] = win;

    // 当窗口关闭时，从跟踪列表中删除
    win.on('closed', () => {
        delete windows[windowName];
    });

    return win;
}

function closeWindow(windowName) {
    if (windows[windowName]) {
        windows[windowName].close();
    }
}

module.exports = { createWindow, closeWindow };
