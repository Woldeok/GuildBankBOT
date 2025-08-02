require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  supportBigNumbers: true, // Enable support for BIGINT and DECIMAL
  bigNumberStrings: true,  // Return BIGINT and DECIMAL as strings
  typeCast: function (field, next) {
    if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
      return field.string();
    }
    return next();
  }
});

// Test the connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database.');
    connection.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

testConnection();

module.exports = pool;
