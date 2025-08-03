const pool = require('../database');
const Decimal = require('decimal.js');

async function collectDailyTax() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Get all user IDs
        const [users] = await connection.query('SELECT id, balance FROM users');

        for (const user of users) {
            const userBalance = new Decimal(user.balance);
            const taxRate = new Decimal(0.05); // 5% tax rate
            const calculatedTax = userBalance.times(taxRate).floor(); // Calculate 5% of balance, round down to integer

            if (calculatedTax.greaterThan(0)) { // Only collect tax if it's greater than 0
                // Deduct tax from user
                await connection.query(
                    'UPDATE users SET balance = balance - ? WHERE id = ?',
                    [calculatedTax.toFixed(2), user.id]
                );

                // Add tax to guild bank
                await connection.query(
                    'UPDATE guild_bank SET balance = balance + ? WHERE id = 1', // Assuming guild_bank has id 1
                    [calculatedTax.toFixed(2)]
                );

                // Record transaction
                const powerOfTen = new Decimal('1e28'); // 10의 28승
                const amountHigh = calculatedTax.dividedBy(powerOfTen).floor();
                const amountLow = calculatedTax.modulo(powerOfTen);

                await connection.query(
                    'INSERT INTO guild_transactions (user_id, amount_high, amount_low, type) VALUES (?, ?, ?, ?)',
                    [user.id, amountHigh.toFixed(0), amountLow.toFixed(2), 'tax_collection']
                );
                console.log(`사용자 ${user.id}로부터 ${calculatedTax.toFixed(0)}의 세금 징수 완료.`);
            } else {
                console.log(`사용자 ${user.id}는 세금 징수 대상이 아닙니다. 잔고: ${userBalance.toFixed(0)}`);
            }
        }

        await connection.commit();
        console.log('Daily tax collection completed successfully.');
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error during daily tax collection:', error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = collectDailyTax;
