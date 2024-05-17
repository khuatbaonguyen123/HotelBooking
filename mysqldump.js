const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

function startDatabaseBackup() {
// Lên lịch cho việc tạo file backup mỗi ngày vào lúc 1 giờ sáng
cron.schedule('0 1 */3 * *', () => {
    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace(/[-T:/]/g, '');
    const backupFileName = `backup_${formattedDate}.sql`;
    const backupFilePath = path.join(__dirname, 'backups', backupFileName);

    const dbUsername = 'root';
    const dbPassword = '12345';
    const dbHost = 'localhost';
    const dbPort = '3307'; // Đặt cổng mong muốn của replica
    const dbName = 'bookingapp';


    const dumpProcess = spawn('C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump', [
        '-u', dbUsername,
        '-p' + dbPassword,
        '--host', dbHost,
        '--port', dbPort,
        dbName
    ]);

    const backupStream = fs.createWriteStream(backupFilePath);
    dumpProcess.stdout.pipe(backupStream);

    dumpProcess.on('exit', (code) => {
        if (code === 0) {
            console.log(`Backup created successfully: ${backupFileName}`);
            cleanUpOldBackups();
        } else {
            console.error(`Backup creation failed with code ${code}`);
        }
    });

    // Hàm để xóa các bản sao lưu cũ hơn
    function cleanUpOldBackups() {
        const backupDir = path.join(__dirname, 'backups');
        const files = fs.readdirSync(backupDir);

        files.forEach((file) => {
            const filePath = path.join(backupDir, file);
            const fileStat = fs.statSync(filePath);
            const isOldBackup = Date.now() - fileStat.mtime.getTime() > 7 * 24 * 60 * 60 * 1000; // Xóa các bản sao lưu cũ hơn 7 ngày

            if (isOldBackup) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old backup: ${file}`);
            }
        });
    }
});
}

module.exports = {
    startDatabaseBackup
};

