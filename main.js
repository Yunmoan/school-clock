const { app, ipcMain,shell } = require('electron');

const configManager = require('./core/configManager');
const { createWindow, closeWindow } = require('./core/windowManager');
const { getSystemInfo } = require('./core/systemInfo');
const { checkNetworkStatus } = require('./core/networkStatus');



app.on('ready', () => {
    // 加载配置文件并存储到全局变量
    global.global_config = configManager.readConfig();

    ipcMain.on('open-url',(event, url)=>{
        shell.openExternal(url);
    });

    ipcMain.on('open-settings', () => {
        // windowManager.createSettingsWindow();
        createWindow('settings.html', 'settingsWindow', { width: 560, height: 800});
    });
    ipcMain.handle('get-config', () => {
        return configManager.readConfig();
    });

    ipcMain.handle('get-system-info', () => {
        return getSystemInfo();
    });

    ipcMain.handle('get-network-status', (event) => {
        return new Promise((resolve) => {
            checkNetworkStatus((isOnline) => {
                resolve(isOnline);
            });
        });
    });

    ipcMain.on('config-saved-settings', (event, newConfig) => {
        configManager.writeConfig(newConfig);
        closeWindow('settingsWindow');
    });

    ipcMain.on('close-window',(event,window_name) => {
        closeWindow(window_name);
    });

    ipcMain.on('open-window',(event,window_file,window_name,options) => {
        createWindow(window_file, window_name, options);
    });

    ipcMain.on('config-saved', (event, newConfig) => {
        configManager.createConfigFile(newConfig);
        closeWindow('initsWindow');
        createMainWindow();
    });

    function createMainWindow() {
        createWindow('index.html', 'mainWindow', { width: 900, height: 600 });
    }

    if (!configManager.checkConfigFile()) {
        // 配置文件不存在，打开初始化窗口
        const initsWindow = createWindow('init.html', 'initsWindow', { width: 600, height: 800 });
        initsWindow.on('closed', () => {
            app.relaunch();
        });
    } else {
        // 配置文件存在，打开主窗口
        createMainWindow();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
