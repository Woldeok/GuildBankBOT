require('dotenv').config();const { exec } = require('child_process');const path = require('path');const fs = require('fs');

const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7일 (밀리초)

async function cleanOldBackups(backupDir) {
    fs.readdir(backupDir, (err, files) => {
        if (err) {
            console.error('오래된 백업 파일 읽기 실패:', err);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(backupDir, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error(`파일 상태 확인 실패: ${filePath}`, err);
                    return;
                }

                if (Date.now() - stats.mtimeMs > SEVEN_DAYS_IN_MS) {
                    fs.unlink(filePath, err => {
                        if (err) {
                            console.error(`오래된 백업 파일 삭제 실패: ${filePath}`, err);
                        } else {
                            console.log(`🗑️ 오래된 백업 파일 삭제: ${filePath}`);
                        }
                    });
                }
            });
        });
    });
}

async function backupDatabase() {
    const DB_HOST = process.env.DB_HOST;
    const DB_USER = process.env.DB_USER;
    const DB_PASSWORD = process.env.DB_PASSWORD;
    const DB_DATABASE = process.env.DB_DATABASE;

    if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_DATABASE) {
        console.error('데이터베이스 백업: .env 파일에 DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE 정보가 모두 설정되어 있어야 합니다.');
        return;
    }

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const backupFileName = `guildbank_backup_${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // WARNING: Including password directly in the command line is insecure.
    // Consider using a .my.cnf file for production environments.
    const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_DATABASE} > ${backupFilePath}`;

    console.log(`데이터베이스 백업 시작: ${backupFileName}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`데이터베이스 백업 실패: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`데이터베이스 백업 오류 (stderr): ${stderr}`);
            return;
        }
        console.log(`✅ 데이터베이스 백업 성공: ${backupFilePath}`);
        cleanOldBackups(backupDir); // 백업 성공 후 오래된 파일 정리
    });
}

module.exports = { backupDatabase };