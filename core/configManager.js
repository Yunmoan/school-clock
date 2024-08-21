const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// 使用 userData 目录来存放配置文件，确保兼容性和安全性
const configFilePath = path.join(app.getPath('userData'), 'data', 'config.json');

function ensureConfigDirectory() {
    const configDirPath = path.dirname(configFilePath);
    if (!fs.existsSync(configDirPath)) {
        try {
            fs.mkdirSync(configDirPath, { recursive: true });
            console.log('Config directory created:', configDirPath);
        } catch (error) {
            console.error('Error creating config directory:', error);
        }
    }
}

function checkConfigFile() {
    try {
        return fs.existsSync(configFilePath);
    } catch (error) {
        console.error('Error checking config file:', error);
        return false;
    }
}

function createConfigFile(defaultConfig = {}) {
    try {
        ensureConfigDirectory(); // 确保配置文件夹存在
        fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
        console.log('Config file created:', configFilePath);
    } catch (error) {
        console.error('Error creating config file:', error);
    }
}

function readConfig() {
    try {
        if (checkConfigFile()) {
            const configData = fs.readFileSync(configFilePath, 'utf-8');
            return JSON.parse(configData);
        } else {
            console.warn('Config file does not exist, returning default configuration.');
            return {};
        }
    } catch (error) {
        console.error('Error reading config file:', error);
        return {};
    }
}

function deleteFolder(filePath) {
    if (fs.existsSync(filePath)) {
        fs.readdirSync(filePath).forEach((file) => {
            const nextFilePath = path.join(filePath, file);
            const stats = fs.statSync(nextFilePath);
            if (stats.isDirectory()) {
                deleteFolder(nextFilePath); // 递归删除子目录
            } else {
                fs.unlinkSync(nextFilePath); // 删除文件
            }
        });
        fs.rmdirSync(filePath);
        console.log("Removed folder and its contents: " + filePath);
    }
}

function resetConfig() {
    const dataDir = path.join(app.getPath('userData'), 'data');
    deleteFolder(dataDir);
}

function writeConfig(data) {
    try {
        ensureConfigDirectory(); // 确保配置文件夹存在
        fs.writeFileSync(configFilePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log('Config file updated:', configFilePath);
    } catch (error) {
        console.error('Error writing config file:', error);
    }
}

module.exports = {
    checkConfigFile,
    createConfigFile,
    readConfig,
    writeConfig,
    resetConfig
};
