const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getCommitHash() {
    try {
        return execSync('git rev-parse --short HEAD').toString().trim();
    } catch (error) {
        console.error('无法获取 Git 提交号', error);
        return 'unknown';
    }
}

function getCurrentTime() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}`;
}

function generateVersion() {
    const versionConfigPath = path.join(__dirname, 'versionConfig.json');
    if (!fs.existsSync(versionConfigPath)) {
        console.error('versionConfig.json 文件不存在');
        return null;
    }

    const versionConfig = JSON.parse(fs.readFileSync(versionConfigPath, 'utf-8'));
    const { major, minor, patch } = versionConfig;
    const commitHash = getCommitHash();
    const timestamp = getCurrentTime();

    return `build.${major}.${minor}.${patch}_${timestamp}_${commitHash}`;
}

module.exports = { generateVersion };
