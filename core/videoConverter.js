const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

// 在开发模式和生产模式下分别设置 ffmpeg 的路径
const ffmpegPath = process.env.NODE_ENV === 'development' ? require('ffmpeg-static') : path.join(process.resourcesPath, 'ffmpeg-static', 'ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath);

function convertWebmToMp4(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .output(outputPath)
            .on('end', () => {
                resolve(outputPath);
            })
            .on('error', (err) => {
                reject(err);
            })
            .run();
    });
}

function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Failed to delete file ${filePath}:`, err);
        }
    });
}

module.exports = { convertWebmToMp4, deleteFile };
