const os = require('os');
const axios = require('axios');
const sudo = require('sudo-prompt'); // 新增
let networkCurrentTime = null;
let networkTime = false;
let timeServer = 'https://api.zyghit.cn/time-aligned?type=unix'; // 使用的时间服务接口


const { exec } = require('child_process');
const options = {
    name: 'SchoolClock'
};



// 通过HTTP GET请求同步网络时间的函数
async function syncNetworkTime() {
    try {
        const response = await axios.get(timeServer);
        if (response.status === 200 && response.data && response.data.time) {
            networkCurrentTime = new Date(response.data.time); // 使用从服务器获取的时间戳
            console.log('Network time synchronized:', networkCurrentTime.toLocaleString());

            // 开始内部时钟，每秒更新 networkCurrentTime
            setInterval(() => {
                networkCurrentTime.setSeconds(networkCurrentTime.getSeconds() + 1);
            }, 1000);
        } else {
            console.error('Failed to synchronize time: Invalid response from server');
        }
    } catch (error) {
        console.error('Failed to synchronize time:', error);
    }

    // 每4小时再次同步时间
    setInterval(syncNetworkTime, 4 * 60 * 60 * 1000);
}

// 初始化并同步时间（由主进程调用）
function initializeTimeSync(config) {
    networkTime = config["network-time"];
    if (networkTime) {
        syncNetworkTime();
    }
}

function initializeNTPTimeSync(config) {
    const ntpServer = config.ntpServer || 'pool.ntp.org'; // 默认 NTP 服务器

    if (process.platform === 'win32') {
        // Windows 系统时间同步
        const command = `w32tm /config /manualpeerlist:"${ntpServer}" /syncfromflags:manual /reliable:YES /update && w32tm /resync`;
        sudo.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`Windows NTP Time synchronization failed: ${error}`);
                return;
            }
            console.log('Windows Time synchronization successful:', stdout);
        });
    } else if (process.platform === 'linux') {
        // Linux 系统时间同步
        const command = `timedatectl set-ntp true && ntpdate ${ntpServer}`;
        sudo.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`Linux NTP Time synchronization failed: ${error}`);
                return;
            }
            console.log('Linux Time synchronization successful:', stdout);
        });
    } else if (process.platform === 'darwin') {
        // macOS 系统时间同步
        const command = `sntp -sS ${ntpServer}`;
        sudo.exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`macOS NTP Time synchronization failed: ${error}`);
                return;
            }
            console.log('macOS Time synchronization successful:', stdout);
        });
    } else {
        console.log('Unsupported operating system');
    }
}

function getSystemInfo() {
    let currentTime = networkCurrentTime ? networkCurrentTime.toLocaleString() : new Date().toLocaleString();
    let timeStatus = networkCurrentTime ? 'Network' : 'Local';
    let timeServerDomain = networkCurrentTime ? 'api.zyghit.cn' : 'N/A'; // 单独定义域名

    return {
        currentTime: currentTime,
        timeStatus: timeStatus,
        timeServer: timeServerDomain, // 返回域名字符串
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        architecture: os.arch(),
        platform: os.platform(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        usedMemory: os.totalmem() - os.freemem(),
        osType: os.type(),
        release: os.release(),
    };
}

module.exports = { getSystemInfo, initializeTimeSync,initializeNTPTimeSync };
