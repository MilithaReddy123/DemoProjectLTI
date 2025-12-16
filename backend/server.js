require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');

const app = express();
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// MySQL connection pool with promises
const pool = mysql
  .createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'demo_app',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  })
  .promise();

// Auto-create database and tables on startup
async function initializeDatabase() {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ MySQL database connected successfully');

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        mobile VARCHAR(15) NOT NULL,
        credit_card_last4 VARCHAR(4),
        state VARCHAR(100) NOT NULL,
        city VARCHAR(100) NOT NULL,
        gender VARCHAR(20) NOT NULL,
        hobbies TEXT NOT NULL,
        tech_interests TEXT NOT NULL,
        additional_info TEXT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ Users table ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_interests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        interest VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ User interests table ready');
    console.log('✓ Database initialization complete');
  } catch (err) {
    console.error('✗ Database initialization failed:', err.message);
    console.error('Please check your database configuration');
  }
}

initializeDatabase();

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

// Create user (registration)
app.post('/api/users', async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      creditCard,
      state,
      city,
      gender,
      hobbies,
      techInterests,
      additionalInfo,
      username,
      password,
      dob
    } = req.body;

    if (!username || !password || !email) {
      return res
        .status(400)
        .json({ message: 'Username, password, and email are required.' });
    }

    const existing = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: 'Username or email already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const creditCardLast4 = creditCard ? creditCard.slice(-4) : null;

    const result = await query(
      `INSERT INTO users
       (name, email, mobile, credit_card_last4, state, city, gender,
        hobbies, tech_interests, additional_info, username, password_hash, dob)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        mobile,
        creditCardLast4,
        state,
        city,
        gender,
        JSON.stringify(hobbies || []),
        JSON.stringify(techInterests || []),
        additionalInfo || null,
        username,
        passwordHash,
        dob
      ]
    );

    const userId = result.insertId;

    if (Array.isArray(techInterests)) {
      const values = techInterests.map((t) => [userId, t]);
      if (values.length) {
        await query(
          'INSERT INTO user_interests (user_id, interest) VALUES ?',
          [values]
        );
      }
    }

    return res
      .status(201)
      .json({ message: 'User created successfully', id: userId });
  } catch (err) {
    console.error('Error creating user', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users (for table display - only relevant fields)
app.get('/api/users', async (req, res) => {
  try {
    const rows = await query(
      `SELECT id, name, email, mobile, state, city, username, dob, tech_interests
       FROM users
       ORDER BY created_at DESC`
    );

    const users = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      mobile: r.mobile,
      state: r.state,
      city: r.city,
      username: r.username,
      dob: r.dob,
      techInterests: JSON.parse(r.tech_interests || '[]')
    }));

    return res.json(users);
  } catch (err) {
    console.error('Error fetching users', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single user by ID (for editing - all fields)
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      `SELECT id, name, email, mobile, credit_card_last4, state, city, gender, 
              hobbies, tech_interests, additional_info, username, dob
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    
    // For editing, show masked credit card (last 4 digits only)
    let creditCardDisplay = '';
    if (user.credit_card_last4) {
      creditCardDisplay = '************' + user.credit_card_last4;
    }
    
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      creditCard: creditCardDisplay,
      state: user.state,
      city: user.city,
      gender: user.gender,
      hobbies: JSON.parse(user.hobbies || '[]'),
      techInterests: JSON.parse(user.tech_interests || '[]'),
      additionalInfo: user.additional_info || '',
      username: user.username,
      dob: user.dob
    });
  } catch (err) {
    console.error('Error fetching user', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      mobile,
      state,
      city,
      gender,
      techInterests,
      hobbies,
      additionalInfo
    } = req.body;

    console.log('Updating user', id, 'with data:', req.body);

    await query(
      `UPDATE users
       SET name = ?,
           email = ?,
           mobile = ?,
           state = ?,
           city = ?,
           gender = ?,
           tech_interests = ?,
           hobbies = ?,
           additional_info = ?
       WHERE id = ?`,
      [
        name,
        email,
        mobile,
        state,
        city,
        gender,
        JSON.stringify(techInterests || []),
        JSON.stringify(hobbies || []),
        additionalInfo || null,
        id
      ]
    );

    // Update tech interests in separate table
    if (Array.isArray(techInterests)) {
      await query('DELETE FROM user_interests WHERE user_id = ?', [id]);
      const values = techInterests.map((t) => [id, t]);
      if (values.length) {
        await query(
          'INSERT INTO user_interests (user_id, interest) VALUES ?',
          [values]
        );
      }
    }

    console.log('User updated successfully');
    return res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Error updating user:', err.message);
    return res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Login (no JWT for now)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt for username:', username);

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'Username and password are required.' });
    }

    const rows = await query(
      'SELECT id, username, password_hash FROM users WHERE username = ?',
      [username]
    );

    console.log('Users found:', rows.length);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    console.log('Password valid:', valid);
    
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({ message: 'Login successful', userId: user.id });
  } catch (err) {
    console.error('Error logging in:', err.message);
    console.error('Full error:', err);
    return res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
});

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});


