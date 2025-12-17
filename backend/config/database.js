const mysql = require('mysql2');

// Create MySQL connection pool with promises
const createPool = () => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'demo_app',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  }).promise();
};

// Initialize database tables
const initializeDatabase = async (pool) => {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ MySQL database connected successfully');

    // Drop old tables if they exist (for clean migration)
    console.log('⚠ Dropping old tables if they exist...');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('DROP TABLE IF EXISTS user_interests');
    await pool.query('DROP TABLE IF EXISTS users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Create users table with UUID
    await pool.query(`
      CREATE TABLE users (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Users table created');

    // Create user_interests table
    await pool.query(`
      CREATE TABLE user_interests (
        user_id VARCHAR(36) NOT NULL PRIMARY KEY,
        mobile VARCHAR(15) NOT NULL,
        credit_card_last4 VARCHAR(4),
        state VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        gender ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Male',
        hobbies JSON,
        tech_interests JSON,
        address TEXT,
        dob DATE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ User interests table created');
    console.log('✓ Database initialization complete');
    console.log('📝 All tables are ready for use!');
  } catch (err) {
    console.error('✗ Database initialization failed:', err.message);
    console.error('Please check your database configuration');
  }
};

module.exports = { createPool, initializeDatabase };
