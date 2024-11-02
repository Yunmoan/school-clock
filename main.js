const { app, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const configManager = require('./core/configManager');
const { createWindow, closeWindow } = require('./core/windowManager');
const { convertWebmToMp4, deleteFile } = require('./core/videoConverter');
const { getSystemInfo, initializeTimeSync,initializeNTPTimeSync } = require('./core/systemInfo');
const { checkNetworkStatus, checkURLStatus } = require('./core/networkStatus');
const { generateVersion } = require('./core/versionGenerator');
const { exec } = require('child_process');
const hitokotoFilePath = path.join(__dirname, 'pages', 'hitokoto', 'localSentences.json');

// 获取用户数据目录
const userDataDir = app.getPath('userData');

// 确保用户数据目录下的 'data' 目录存在
const dataDir = path.join(userDataDir, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

app.on('ready', () => {
    global.global_config = configManager.readConfig();
    const version = generateVersion();
    global.appVersion = version;  // 将版本号存储在全局变量中

    // 输出版本号（可选）
    console.log(`Version: ${version}`);

    // 初始化并同步时间
    initializeTimeSync(global.global_config);

    initializeNTPTimeSync(global.global_config);
    console.log('sync ntp time')

    // 配置文件路径
    const configFilePath = path.join(app.getPath('userData'), 'data', 'config.json');

    ipcMain.handle('get-app-version', () => {
        return global.appVersion;
    });



    // 处理打开配置文件目录的请求
    ipcMain.on('open-config-folder', (event) => {
        const configDir = path.dirname(configFilePath);
        shell.openPath(configDir)
            .then(() => {
                console.log('Config folder opened:', configDir);
            })
            .catch((error) => {
                console.error('Failed to open config folder:', error);
            });
    });

    // 配置文件路径
    const configDir = path.join(app.getPath('userData'), 'data');

    // 提供配置文件目录路径给渲染进程
    ipcMain.handle('get-config-directory', () => {
        return configDir;
    });

    ipcMain.on('open-url', (event, url) => {
        shell.openExternal(url);
    });

    ipcMain.on('sync-time', () => {
        initializeNTPTimeSync(global.global_config)
    });

    ipcMain.on('upload-webm', (event, { data }) => {
        const inputPath = path.join(dataDir, 'input.webm');
        const outputPath = path.join(dataDir, 'play.mp4');

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
        const savePath = path.join(dataDir, 'play.mp4');
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

    ipcMain.handle('get-local-hitokoto', async () => {
        try {
            const fileContent = fs.readFileSync(hitokotoFilePath, 'utf-8');
            const { data } = JSON.parse(fileContent);

            if (Array.isArray(data) && data.length > 0) {
                return data[Math.floor(Math.random() * data.length)];
            } else {
                throw new Error('No sentences available in the file.');
            }
        } catch (error) {
            console.error('Error reading sentences file:', error);
            return null;
        }
    });

    ipcMain.on('open-settings', () => {
        createWindow('settings.html', 'settingsWindow', { width: 560, height: 800 });
    });

    ipcMain.handle('get-config', () => {
        return configManager.readConfig();
    });

    ipcMain.on('upload-background', (event, { data, fileName, newConfig }) => {
        const savePath = path.join(dataDir, fileName);
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
        createWindow('index.html', 'mainWindow', { width: 900, height: 600 });
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
        const backgroundPath = path.join(dataDir, global.global_config['background-image']);
        if (fs.existsSync(backgroundPath)) {
            fs.unlinkSync(backgroundPath);
        }
        event.reply('background-cleared');
    });

    ipcMain.on('kill-all', () => {
        app.quit();
    });

    ipcMain.on('reset-settings', () => {
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
