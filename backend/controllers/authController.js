const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Controller: Register new auth user (name, username, email, password)
const register = (pool) => async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    // Basic presence validation
    if (!name || !username || !email || !password) {
      return res.status(400).json({
        message: 'Name, username, email and password are required.'
      });
    }

    // Name validation: min 2 chars, only letters and spaces (no numbers)
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: 'Name must be at least 2 characters.' });
    }
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(name.trim())) {
      return res.status(400).json({
        message: 'Name can only contain letters and spaces (numbers not allowed).'
      });
    }

    // Username validation: 4‑20 chars, only letters, numbers, underscore and @
    const usernamePattern = /^[a-zA-Z0-9_@]{4,20}$/;
    if (!usernamePattern.test(username)) {
      return res.status(400).json({
        message:
          'Username must be 4-20 characters (letters, numbers, underscore _ and @ only).'
      });
    }

    // Email validation: check for valid format and TLD
    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      return res
        .status(400)
        .json({ message: 'Please enter a valid email address with a valid domain extension (e.g., .com, .org, .net).' });
    }

    // Password strength (same as frontend)
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
    if (password.length < 8 || !passwordPattern.test(password)) {
      return res.status(400).json({
        message:
          'Password must be at least 8 characters and include uppercase, lowercase, number and special character.'
      });
    }

    // Check if username or email already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? UNION SELECT id FROM users WHERE email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        message: 'Username or email already exists. Please use a different one.'
      });
    }

    // Generate UUID and hash password
    const userId = uuidv4();
    const saltRounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    await pool.query(
      'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, name.trim(), email.trim().toLowerCase(), username, passwordHash]
    );

    console.log('✓ New user registered:', username);

    return res.status(201).json({
      message: 'Registration successful!',
      user: { id: userId, username, email: email.trim().toLowerCase(), name: name.trim() }
    });
  } catch (err) {
    console.error('Error during registration:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

// Controller: Login with username or email + password
const login = (pool) => async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required.'
      });
    }

    // Allow login by username OR email - optimized: fetch all needed fields in single query using UNION
    const [rows] = await pool.query(
      `SELECT id, username, email, name, password_hash 
       FROM users 
       WHERE username = ? 
       UNION 
       SELECT id, username, email, name, password_hash 
       FROM users 
       WHERE email = ? 
       LIMIT 1`,
      [username, username]
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

    // Return user details directly from first query (no second query needed)
    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Error logging in:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

module.exports = {
  register,
  login
};

