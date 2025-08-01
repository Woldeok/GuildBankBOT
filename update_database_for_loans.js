
const pool = require('./database');

async function updateDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('데이터베이스에 연결되었습니다.');

        // 기존 loans 테이블이 있다면 삭제
        await connection.query('DROP TABLE IF EXISTS loans');
        console.log('기존 `loans` 테이블이 삭제되었습니다 (존재하는 경우).');

        // loans 테이블 생성
        await connection.query(`
            CREATE TABLE IF NOT EXISTS loans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                amount DECIMAL(30, 2) NOT NULL,
                interest_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.05,
                due_date DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('active', 'paid') NOT NULL DEFAULT 'active',
                INDEX(user_id)
            )
        `);
        console.log('`loans` 테이블이 성공적으로 생성되었거나 이미 존재합니다.');

    } catch (error) {
        console.error('데이터베이스 업데이트 중 오류 발생:', error);
    } finally {
        if (connection) {
            connection.release();
            console.log('데이터베이스 연결이 종료되었습니다.');
        }
        pool.end();
    }
}

updateDatabase();
