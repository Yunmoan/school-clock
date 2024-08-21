const https = require('https');

function checkNetworkStatus(callback) {
    const url = 'https://www.baidu.com'; // 可以换成其他稳定的公共URL

    https.get(url, (res) => {
        if (res.statusCode === 200) {
            callback(true); // 网络正常
        } else {
            callback(false); // 网络异常
        }
    }).on('error', (e) => {
        callback(false); // 无法访问，网络异常
    });
}

function checkURLStatus(url, callback) {
    https.get(url, (res) => {
        if (res.statusCode === 200) {
            callback(true); // URL is accessible
        } else {
            callback(false); // URL is not accessible
        }
    }).on('error', (e) => {
        callback(false); // URL is not accessible
    });
}

module.exports = { checkNetworkStatus, checkURLStatus };
