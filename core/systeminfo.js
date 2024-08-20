const os = require('os');

function getSystemInfo() {
    return {
        currentTime: new Date().toLocaleString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        architecture: os.arch(),
        platform: os.platform(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        usedMemory: os.totalmem() - os.freemem(),
        osType: os.type(),
    };
}

module.exports = { getSystemInfo };
