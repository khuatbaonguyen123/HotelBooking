const { spawn } = require('child_process');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const DB_NAME = 'bookinghotel';
const COLLECTION_NAME = 'rating';
const BACKUP_DIR = path.join(__dirname, 'Backup_MongoDB');
const ARCHIVE_PATH = path.join(__dirname, 'Backup_MongoDB', `${DB_NAME}.gzip`);
const MONGO_URI = process.env.MONGOLOCAL_URL;

// Lên lịch sao lưu mỗi ngày vào lúc 00:00
cron.schedule('0 0 * * *', () => backupMongoDB());
// Lên lịch kiểm tra bảng mỗi 5 phút
cron.schedule('*/30 * * * *', () => checkCollectionExists());

// Lên lịch xóa các tệp sao lưu cũ mỗi ngày vào lúc 01:00
cron.schedule('0 1 * * *', () => deleteOldBack_up());

// 1. mongodump --db=rbac_tutorial --archive=./rbac.gzip --gzip

function backupMongoDB() {
  const child = spawn('mongodump', [
    `--db=${DB_NAME}`,
    `--archive=${ARCHIVE_PATH}`,
    '--gzip',
  ]);

  child.stdout.on('data', (data) => {
    console.log('stdout:\n', data);
  });
  child.stderr.on('data', (data) => {
    console.log('stderr:\n', Buffer.from(data).toString());
  });
  child.on('error', (error) => {
    console.log('error:\n', error);
  });
  child.on('exit', (code, signal) => {
    if (code) console.log('Process exit with code:', code);
    else if (signal) console.log('Process killed with signal:', signal);
    else console.log('Backup is successfull');
  });
}

// 2. mongorestore --db=rbac_tutorial --archive=./rbac.gzip --gzip

function restoreMongoDB() {
  const child = spawn('mongorestore', [
    `--db=${DB_NAME}`,
    `--archive=${ARCHIVE_PATH}`,
    '--gzip',
  ]);

  child.stdout.on('data', (data) => {
    console.log('stdout:\n', data);
  });
  child.stderr.on('data', (data) => {
    console.log('stderr:\n', Buffer.from(data).toString());
  });
  child.on('error', (error) => {
    console.log('error:\n', error);
  });
  child.on('exit', (code, signal) => {
    if (code) console.log('Process exit with code:', code);
    else if (signal) console.log('Process killed with signal:', signal);
    else console.log('Restore is successfull');
  });
}

// check sự tồn tại của db

async function checkCollectionExists() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collections = await db.listCollections({ name: COLLECTION_NAME }).toArray();
    if (collections.length === 0) {
      console.log(`Bảng ${COLLECTION_NAME} không tồn tại. Đang khôi phục...`);
      restoreMongoDB();
    } else {
      console.log(`Bảng ${COLLECTION_NAME} tồn tại.`);
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra bảng:', error);
  } finally {
    await client.close();
  }
}

function deleteOldBack_up() {
  const now = Date.now();
  const retentionPeriod = 7 * 24 * 60 * 60 * 1000; // 7 ngày

  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) {
      console.error('Lỗi khi đọc thư mục sao lưu:', err);
      return;
    }

    files.forEach(file => {BACKUP_DIR
      const filePath = path.join(BACKUP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Lỗi khi lấy thông tin tệp:', err);
          return;
        }

        if (now - stats.mtimeMs > retentionPeriod) {
          fs.unlink(filePath, err => {
            if (err) {
              console.error('Lỗi khi xóa tệp:', err);
            } else {
              console.log(`Đã xóa tệp sao lưu cũ: ${file}`);
            }
          });
        }
      });
    });
  });
}


module.exports = {
  backupMongoDB, checkCollectionExists
};