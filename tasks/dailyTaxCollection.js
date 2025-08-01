const pool = require('../database');
const Decimal = require('decimal.js');

async function collectDailyTax() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const taxAmount = new Decimal(100); // Daily tax amount as Decimal

        // Get all user IDs
        const [users] = await connection.query('SELECT id, balance FROM users');

        for (const user of users) {
            const userBalance = new Decimal(user.balance);
            if (userBalance.greaterThanOrEqualTo(taxAmount)) {
                // Deduct tax from user
                await connection.query(
                    'UPDATE users SET balance = balance - ? WHERE id = ?',
                    [taxAmount.toFixed(2), user.id]
                );

                // Add tax to guild bank
                await connection.query(
                    'UPDATE guild_bank SET balance = balance + ? WHERE id = 1', // Assuming guild_bank has id 1
                    [taxAmount.toFixed(2)]
                );

                // Record transaction
                await connection.query(
                    'INSERT INTO guild_transactions (user_id, amount, type) VALUES (?, ?, ?)',
                    [user.id, taxAmount.toFixed(2), 'tax_collection']
                );
                console.log(`Collected ${taxAmount.toFixed(0)} from user ${user.id}`);
            } else {
                console.log(`User ${user.id} has insufficient balance for tax. Balance: ${userBalance.toFixed(0)}`);
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
