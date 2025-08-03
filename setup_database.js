
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
                quantity DECIMAL(65, 0) NOT NULL,
                average_purchase_price DECIMAL(30, 2) NOT NULL,
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

        // Drop guild_transactions table if it exists to apply schema changes
        await connection.query('DROP TABLE IF EXISTS guild_transactions');
        console.log('Table "guild_transactions" dropped if it existed.');

        // Create guild_transactions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                amount_high DECIMAL(35, 0) NOT NULL,
                amount_low DECIMAL(30, 2) NOT NULL,
                type ENUM('deposit', 'withdrawal', 'loan', 'repayment') NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table "guild_transactions" created or already exists.');

        // Create bank_profit_records table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bank_profit_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                guild_bank_balance_snapshot DECIMAL(30, 2) NOT NULL,
                net_profit_since_last_record DECIMAL(30, 2) NULL
            )
        `);
        console.log('Table "bank_profit_records" created or already exists.');

        // Drop guild_stocks table if it exists to apply schema changes
        await connection.query('DROP TABLE IF EXISTS guild_stocks');
        console.log('Table "guild_stocks" dropped if it existed.');

        // Create guild_stocks table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_stocks (
                guild_id INT NOT NULL DEFAULT 1,
                stock_id INT NOT NULL,
                quantity DECIMAL(65, 0) NOT NULL,
                average_purchase_price DECIMAL(30, 2) NOT NULL,
                PRIMARY KEY (guild_id, stock_id),
                FOREIGN KEY (stock_id) REFERENCES stocks(id)
            )
        `);
        console.log('Table "guild_stocks" created or already exists.');

        

        // Add or modify 'loan' and 'repayment' to the ENUM for 'type' column in guild_transactions
        await connection.query(`
            ALTER TABLE guild_transactions MODIFY COLUMN type ENUM('deposit', 'withdrawal', 'loan', 'repayment', 'loan_collection', 'guild_buy', 'tax_collection', 'transfer_sent', 'transfer_received', 'transfer_fee', 'stock_trading_profit', 'stock_trading_loss') NOT NULL;
        `);
        console.log('Modified "type" column in "guild_transactions" table.');

        // Create guilds table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guilds (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at DATETIME DEFAULT NOW()
            )
        `);
        console.log('Table "guilds" created or already exists.');

        // Create guild_members table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_members (
                user_id VARCHAR(255) PRIMARY KEY,
                guild_id INT NOT NULL,
                joined_at DATETIME DEFAULT NOW(),
                FOREIGN KEY (guild_id) REFERENCES guilds(id)
            )
        `);
        console.log('Table "guild_members" created or already exists.');

        // Create guild_missions table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_missions (
                id INT PRIMARY KEY AUTO_INCREMENT,
                guild_id INT NOT NULL,
                type ENUM('수익률', '거래량', '도박승리') NOT NULL,
                target_value DECIMAL(30, 2) NOT NULL,
                current_value DECIMAL(30, 2) DEFAULT 0,
                completed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (guild_id) REFERENCES guilds(id)
            )
        `);
        console.log('Table "guild_missions" created or already exists.');

        // Create guild_seasons table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_seasons (
                id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME,
                ranking_criteria ENUM('수익률', '총거래량', '참여도') NOT NULL,
                is_active BOOLEAN DEFAULT FALSE
            )
        `);
        console.log('Table "guild_seasons" created or already exists.');

        // Create guild_rewards table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_rewards (
                id INT PRIMARY KEY AUTO_INCREMENT,
                guild_id INT NOT NULL,
                season_id INT NOT NULL,
                reward_type VARCHAR(100) NOT NULL,
                reward_value TEXT NOT NULL,
                claimed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (guild_id) REFERENCES guilds(id),
                FOREIGN KEY (season_id) REFERENCES guild_seasons(id)
            )
        `);
        console.log('Table "guild_rewards" created or already exists.');

        // Create guild_invitations table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS guild_invitations (
                id INT PRIMARY KEY AUTO_INCREMENT,
                guild_id INT NOT NULL,
                inviter_id VARCHAR(255) NOT NULL,
                invitee_id VARCHAR(255) NOT NULL,
                status ENUM('pending', 'accepted', 'declined', 'expired') DEFAULT 'pending',
                created_at DATETIME DEFAULT NOW(),
                expires_at DATETIME,
                FOREIGN KEY (guild_id) REFERENCES guilds(id)
            )
        `);
        console.log('Table "guild_invitations" created or already exists.');

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

        // const [stocks] = await connection.query('SELECT COUNT(*) as count FROM stocks');
        // if (stocks[0].count === 0) {
            await connection.query(`
                INSERT INTO stocks (name, symbol, price) VALUES
                ('삼성전자', '삼전', 100000),
                ('SK하이닉스', '하이닉스', 100000),
                ('카카오', '카카오', 100000),
                ('네이버', '네이버', 100000),
                ('LG화학', 'LG화학', 100000),
                ('현대차', '현대차', 100000),
                ('기아', '기아', 100000),
                ('셀트리온', '셀트리온', 100000),
                ('POSCO홀딩스', '포스코', 100000),
                ('KB금융', 'KB금융', 100000)
            `);
            console.log('Initial stocks inserted.');
        // }

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
