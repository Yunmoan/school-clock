const { app, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const configManager = require('./core/configManager');
const { createWindow, closeWindow } = require('./core/windowManager');
const { convertWebmToMp4, deleteFile } = require('./core/videoConverter');
const { getSystemInfo } = require('./core/systemInfo');
const { checkNetworkStatus, checkURLStatus } = require('./core/networkStatus');

// 确保 'data' 目录存在
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// app.disableHardwareAcceleration();
// app.commandLine.appendSwitch('disable-gpu');

app.on('ready', () => {
    global.global_config = configManager.readConfig();

    ipcMain.on('open-url', (event, url) => {
        shell.openExternal(url);
    });

    ipcMain.on('upload-webm', (event, { data }) => {
        const inputPath = path.join("data", 'input.webm');
        const outputPath = path.join("data", 'play.mp4');

        fs.writeFile(inputPath, Buffer.from(new Uint8Array(data)), (err) => {
            if (err) {
                console.error('Failed to save the .webm file:', err);
                event.sender.send('convert-done', false);
                return;
            }

            convertWebmToMp4(inputPath, outputPath)
                .then(() => {
                    event.sender.send('convert-done', true, outputPath);
                    deleteFile(inputPath);
                })
                .catch((err) => {
                    console.error('Conversion failed:', err);
                    event.sender.send('convert-done', false);
                });
        });
    });

    ipcMain.on('upload-mp4', (event, { data }) => {
        const savePath = path.join('data', 'play.mp4');
        fs.writeFile(savePath, Buffer.from(new Uint8Array(data)), (err) => {
            if (err) {
                console.error('Failed to save the file:', err);
                event.sender.send('upload-status', false, 'File save failed');
                return;
            }
            console.log('File saved as play.mp4:', savePath);
            event.sender.send('upload-status', true, 'File uploaded successfully');
        });
    });

    ipcMain.on('open-settings', () => {
        createWindow('settings.html', 'settingsWindow', { width: 560, height: 800 });
    });

    ipcMain.handle('get-config', () => {
        return configManager.readConfig();
    });




    ipcMain.on('upload-background', (event, { data, fileName ,newConfig}) => {
        const savePath = path.join('data', fileName);
        fs.writeFileSync(savePath, Buffer.from(data));
        event.reply('background-uploaded', savePath);
        configManager.writeConfig(newConfig);
    });


    ipcMain.handle('get-system-info', () => {
        return getSystemInfo();
    });

    ipcMain.handle('get-network-status', async () => {
        return new Promise((resolve) => {
            checkNetworkStatus((isOnline) => {
                resolve(isOnline);
            });
        });
    });

    ipcMain.handle('check-url-status', async (event, url) => {
        return new Promise((resolve) => {
            checkURLStatus(url, (isAccessible) => {
                resolve(isAccessible);
            });
        });
    });

    ipcMain.on('config-saved-settings', (event, newConfig) => {
        configManager.writeConfig(newConfig);
        closeWindow('settingsWindow');
    });



    ipcMain.on('close-window', (event, window_name) => {
        closeWindow(window_name);
    });

    ipcMain.on('open-window', (event, window_file, window_name, options) => {
        createWindow(window_file, window_name, options);
    });

    ipcMain.on('config-saved', (event, newConfig) => {
        configManager.createConfigFile(newConfig);
        closeWindow('initsWindow');
        createMainWindow();
    });

    ipcMain.on('clear-background', (event) => {
        // 处理清除背景图片的逻辑
        const backgroundPath = path.join('data');
        // 可选：删除背景图片文件（如果需要删除）
        fs.unlinkSync(path.join(backgroundPath, global_config['background-image']));

        // 清除配置中的背景图片路径
        event.reply('background-cleared');
    });

    ipcMain.on('kill-all', () => {
        app.quit();
    });

    ipcMain.on("reset-settings", () => {
        configManager.resetConfig();
        app.quit();
    });

    function createMainWindow() {
        createWindow('index.html', 'mainWindow', { width: 900, height: 600 });
    }

    if (!configManager.checkConfigFile()) {
        const initsWindow = createWindow('init.html', 'initsWindow', { width: 600, height: 800 });
        initsWindow.on('closed', () => {
            app.relaunch();
        });
    } else {
        createMainWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
