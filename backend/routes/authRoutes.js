const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (pool) => {
  
  // Register endpoint
  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required.' 
        });
      }

      // Validate username format
      const usernamePattern = /^[a-zA-Z0-9._-]{4,20}$/;
      if (!usernamePattern.test(username)) {
        return res.status(400).json({ 
          message: 'Username must be 4-20 characters (letters, numbers, . _ - allowed)' 
        });
      }

      // Validate password strength
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
      if (password.length < 8 || !passwordPattern.test(password)) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
        });
      }

      // Check if username already exists
      const [existing] = await pool.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );

      if (existing.length > 0) {
        return res.status(400).json({ 
          message: 'Username already exists. Please choose a different username.' 
        });
      }

      // Generate UUID and hash password
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert new user
      await pool.query(
        'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
        [userId, username, `${username}@temp.com`, username, passwordHash]
      );

      console.log('✓ New user registered:', username);

      return res.status(201).json({ 
        message: 'Registration successful! You can now login.',
        userId: userId
      });
    } catch (err) {
      console.error('Error during registration:', err.message);
      return res.status(500).json({ 
        message: 'Internal server error: ' + err.message 
      });
    }
  });

  // Login endpoint
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          message: 'Username and password are required.' 
        });
      }

      const [rows] = await pool.query(
        'SELECT id, username, password_hash FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      console.log('✓ User logged in:', username);

      return res.json({ 
        message: 'Login successful', 
        userId: user.id 
      });
    } catch (err) {
      console.error('Error logging in:', err.message);
      return res.status(500).json({ 
        message: 'Internal server error: ' + err.message 
      });
    }
  });

  return router;
};
