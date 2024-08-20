const dns = require('dns');

function checkNetworkStatus(callback) {
    dns.lookup('google.com', (err) => {
        if (err && err.code === 'ENOTFOUND') {
            callback(false); // Offline
        } else {
            callback(true); // Online
        }
    });
}

module.exports = { checkNetworkStatus };
