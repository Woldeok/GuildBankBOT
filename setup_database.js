
require('dotenv').config();
const pool = require('./database');

async function setupDatabase() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Connected to the database.');

        // Create stocks table with symbol
        await connection.query(`
            CREATE TABLE IF NOT EXISTS stocks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                symbol VARCHAR(10) NOT NULL UNIQUE,
                price DECIMAL(10, 2) NOT NULL
            )
        `);
        console.log('Table "stocks" created or already exists.');

        // Create user_stocks table with average_purchase_price
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_stocks (
                user_id VARCHAR(255) NOT NULL,
                stock_id INT NOT NULL,
                quantity INT NOT NULL,
                average_purchase_price DECIMAL(10, 2) NOT NULL,
                PRIMARY KEY (user_id, stock_id),
                FOREIGN KEY (stock_id) REFERENCES stocks(id)
            )
        `);
        console.log('Table "user_stocks" created or already exists.');

        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                balance DECIMAL(30, 2) NOT NULL DEFAULT 0,
                interest_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.01
            )
        `);
        console.log('Table "users" created or already exists.');

        // Alter users table to ensure balance is DECIMAL(30, 2)
        await connection.query(`
            ALTER TABLE users MODIFY COLUMN balance DECIMAL(30, 2) NOT NULL DEFAULT 0;
        `);
        console.log('Modified "balance" column in "users" table to DECIMAL(30, 2).');

        // Create guild_bank table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_bank (
                id INT AUTO_INCREMENT PRIMARY KEY,
                balance DECIMAL(30, 2) NOT NULL DEFAULT 0.00
            )
        `);
        console.log('Table "guild_bank" created or already exists.');

        // Alter guild_bank table to ensure balance is DECIMAL(30, 2)
        await connection.query(`
            ALTER TABLE guild_bank MODIFY COLUMN balance DECIMAL(30, 2) NOT NULL DEFAULT 0.00;
        `);
        console.log('Modified "balance" column in "guild_bank" table to DECIMAL(30, 2).');

        // Insert initial row into guild_bank if it's empty
        const [guildBank] = await connection.query('SELECT COUNT(*) as count FROM guild_bank');
        if (guildBank[0].count === 0) {
            await connection.query('INSERT INTO guild_bank (balance) VALUES (0.00)');
            console.log('Initial row inserted into "guild_bank".');
        }

        // Create guild_transactions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                type ENUM('deposit', 'withdrawal', 'loan', 'repayment') NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table "guild_transactions" created or already exists.');

        // Create guild_stocks table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_stocks (
                guild_id INT NOT NULL DEFAULT 1,
                stock_id INT NOT NULL,
                quantity INT NOT NULL,
                average_purchase_price DECIMAL(10, 2) NOT NULL,
                PRIMARY KEY (guild_id, stock_id),
                FOREIGN KEY (stock_id) REFERENCES stocks(id)
            )
        `);
        console.log('Table "guild_stocks" created or already exists.');

        // Add or modify 'loan' and 'repayment' to the ENUM for 'type' column in guild_transactions
        await connection.query(`
            ALTER TABLE guild_transactions MODIFY COLUMN type ENUM('deposit', 'withdrawal', 'loan', 'repayment', 'loan_collection', 'guild_buy', 'tax_collection', 'transfer_sent', 'transfer_received', 'transfer_fee') NOT NULL;
        `);
        console.log('Modified "type" column in "guild_transactions" table.');

        // Add some initial stocks if the table is empty
        // 외래 키 제약 조건 때문에 user_stocks를 먼저 비워야 함
        await connection.query('SET FOREIGN_KEY_CHECKS = 0'); // 외래 키 제약 조건 비활성화
        console.log('Foreign key checks disabled.');

        await connection.query('TRUNCATE TABLE user_stocks');
        console.log('Table "user_stocks" truncated.');
        await connection.query('TRUNCATE TABLE stocks');
        console.log('Table "stocks" truncated.');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1'); // 외래 키 제약 조건 활성화
        console.log('Foreign key checks enabled.');

        const [stocks] = await connection.query('SELECT COUNT(*) as count FROM stocks');
        if (stocks[0].count === 0) {
            await connection.query(`
                INSERT INTO stocks (name, symbol, price) VALUES
                ('삼성전자', '삼전', 80000),
                ('SK하이닉스', '하이닉스', 130000),
                ('카카오', '카카오', 120000),
                ('네이버', '네이버', 350000),
                ('LG화학', 'LG화학', 700000),
                ('현대차', '현대차', 200000),
                ('기아', '기아', 90000),
                ('셀트리온', '셀트리온', 250000),
                ('POSCO홀딩스', '포스코', 400000),
                ('KB금융', 'KB금융', 60000)
            `);
            console.log('Initial stocks inserted.');
        }

    } catch (error) {
        console.error('Error setting up the database:', error);
    } finally {
        if (connection) {
            connection.release();
            console.log('Database connection released.');
        }
        pool.end(); // Close the pool
    }
}

setupDatabase();
