const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sanitizeValue, parseJsonField, extractCreditCardLast4, formatTimestamp } = require('../utils/userHelpers');

// List all users with joined interests
const getAllUsers = (pool) => async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users`);

    const [rows] = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        u.created_at,
        u.updated_at,
        ui.mobile,
        ui.credit_card_last4,
        ui.state,
        ui.city,
        ui.gender,
        ui.hobbies,
        ui.tech_interests,
        ui.address,
        ui.dob
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const users = rows.map((r) => {
      const creditCardLast4 = sanitizeValue(r.credit_card_last4);
      // Format DOB as YYYY-MM-DD string (MySQL DATE type comes as Date object)
      let dobFormatted = null;
      if (r.dob) {
        const d = r.dob instanceof Date ? r.dob : new Date(r.dob);
        if (!isNaN(d.getTime())) {
          dobFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
      }
      
      return {
        id: r.id,
        name: r.name,
        email: r.email,
        username: r.username,
        created_at: formatTimestamp(r.created_at),
        updated_at: formatTimestamp(r.updated_at),
        mobile: sanitizeValue(r.mobile),
        creditCard: creditCardLast4 ? '************' + creditCardLast4 : null,
        state: sanitizeValue(r.state),
        city: sanitizeValue(r.city),
        gender: r.gender || 'Male',
        hobbies: Array.isArray(parseJsonField(r.hobbies)) ? parseJsonField(r.hobbies) : [],
        techInterests: Array.isArray(parseJsonField(r.tech_interests)) ? parseJsonField(r.tech_interests) : [],
        address: sanitizeValue(r.address),
        dob: dobFormatted
      };
    });

    return res.json({ items: users, total: Number(total) || 0, limit, offset });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

// Get single user by id with details
const getUserById = (pool) => async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.username,
        ui.mobile,
        ui.credit_card_last4,
        ui.state,
        ui.city,
        ui.gender,
        ui.hobbies,
        ui.tech_interests,
        ui.address,
        ui.dob
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      WHERE u.id = ?
    `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const creditCardLast4 = sanitizeValue(user.credit_card_last4);
    
    // Format DOB as YYYY-MM-DD string
    let dobFormatted = null;
    if (user.dob) {
      const d = user.dob instanceof Date ? user.dob : new Date(user.dob);
      if (!isNaN(d.getTime())) {
        dobFormatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      mobile: sanitizeValue(user.mobile),
      creditCard: creditCardLast4 ? '************' + creditCardLast4 : null,
      state: sanitizeValue(user.state),
      city: sanitizeValue(user.city),
      gender: user.gender || 'Male',
      hobbies: Array.isArray(parseJsonField(user.hobbies)) ? parseJsonField(user.hobbies) : [],
      techInterests: Array.isArray(parseJsonField(user.tech_interests)) ? parseJsonField(user.tech_interests) : [],
      address: sanitizeValue(user.address),
      dob: dobFormatted
    });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

// Create new user + interests (Cafeteria member registration)
const createUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();

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
      address,
      username,
      password,
      dob
    } = req.body;


    // Validate required fields (aligned with frontend form)
    if (!name || !email || !mobile || !state || !city || !username || !password) {
      return res.status(400).json({
        message:
          'Required fields: name, email, mobile, state, city, username, password'
      });
    }

    // Name validation: min 2 chars, only letters and spaces (no numbers) - aligned with frontend
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        message: 'Name must be at least 2 characters.'
      });
    }
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(name.trim())) {
      return res.status(400).json({
        message: 'Name can only contain letters and spaces (numbers not allowed).'
      });
    }

    // Email format validation (aligned with frontend)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({
        message: 'Please enter a valid email address with a valid domain extension (e.g., .com, .org, .net).'
      });
    }

    // Username format validation (aligned with frontend: 4-20 chars, letters, numbers, _, -, .)
    const usernamePattern = /^[a-zA-Z0-9._-]{4,20}$/;
    if (!usernamePattern.test(username)) {
      return res.status(400).json({
        message: 'Username must be 4-20 characters (letters, numbers, _, -, . only).'
      });
    }

    // Mobile validation (10 digits)
    const mobileDigits = mobile.replace(/\D/g, '');
    if (mobileDigits.length !== 10) {
      return res.status(400).json({
        message: 'Mobile number must be exactly 10 digits.'
      });
    }

    // Password strength validation (aligned with frontend)
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
    if (password.length < 8 || !passwordPattern.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character.'
      });
    }

    if (!Array.isArray(hobbies) || hobbies.length === 0) {
      return res.status(400).json({
        message: 'Please select at least one hobby'
      });
    }

    if (!Array.isArray(techInterests) || techInterests.length === 0) {
      return res.status(400).json({
        message: 'Please select at least one tech interest'
      });
    }

    await connection.beginTransaction();

    // Check if user exists by username or email - optimized: use UNION for better index usage
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? UNION SELECT id FROM users WHERE email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Username or email already exists.'
      });
    }

    // Generate UUID and hash password
    const userId = uuidv4();
    const saltRounds = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert into users table
    await connection.query(
      'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
      [userId, name, email, username, passwordHash]
    );

    await connection.query(
      `
      INSERT INTO user_interests 
      (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        sanitizeValue(mobile),
        extractCreditCardLast4(creditCard),
        sanitizeValue(state),
        sanitizeValue(city),
        gender || 'Male',
        JSON.stringify(hobbies),
        JSON.stringify(techInterests),
        sanitizeValue(address),
        sanitizeValue(dob)
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'User created successfully',
      id: userId
    });
  } catch (err) {
    try { await connection.rollback(); } catch {}
    console.error('Error creating user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  } finally {
    connection.release();
  }
};

// Update existing user + interests
const updateUser = (pool) => async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;
    const {
      name,
      username,
      email,
      mobile,
      creditCard,
      state,
      city,
      gender,
      hobbies,
      techInterests,
      address,
      dob
    } = req.body;

    await connection.beginTransaction();

    // Ensure user exists and safely handle optional fields (some UIs don't send username on update)
    const [existingUserRows] = await connection.query(
      'SELECT id, name, email, username FROM users WHERE id = ?',
      [id]
    );
    if (!existingUserRows.length) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    const existingUser = existingUserRows[0];
    const nextName = sanitizeValue(name) ?? existingUser.name;
    const nextEmail = sanitizeValue(email) ?? existingUser.email;
    const nextUsername = sanitizeValue(username) ?? existingUser.username;

    // Prevent accidental null/empty values on NOT NULL columns
    if (!nextName || !nextEmail || !nextUsername) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid update: name/email/username cannot be empty.' });
    }

    // Name validation: min 2 chars, only letters and spaces (no numbers) - aligned with frontend
    if (name && name !== existingUser.name) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Name must be at least 2 characters.'
        });
      }
      const namePattern = /^[a-zA-Z\s]+$/;
      if (!namePattern.test(nextName.trim())) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Name can only contain letters and spaces (numbers not allowed).'
        });
      }
    }

    // Email format validation (aligned with frontend)
    if (email && email !== existingUser.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(nextEmail.trim())) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Please enter a valid email address with a valid domain extension (e.g., .com, .org, .net).'
        });
      }
    }

    // Username format validation (aligned with frontend: 4-20 chars, letters, numbers, _, -, .)
    if (username && username !== existingUser.username) {
      const usernamePattern = /^[a-zA-Z0-9._-]{4,20}$/;
      if (!usernamePattern.test(nextUsername)) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Username must be 4-20 characters (letters, numbers, _, -, . only).'
        });
      }
    }

    // Mobile validation (if provided, must be 10 digits)
    if (mobile) {
      const mobileDigits = mobile.replace(/\D/g, '');
      if (mobileDigits.length !== 10) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Mobile number must be exactly 10 digits.'
        });
      }
    }

    // Uniqueness checks (DB has UNIQUE constraints; do a friendly 400 before hitting ER_DUP_ENTRY)
    // Optimized: use UNION instead of OR for better index usage
    const [conflicts] = await connection.query(
      `SELECT id, email, username FROM users WHERE email = ? AND id <> ? 
       UNION 
       SELECT id, email, username FROM users WHERE username = ? AND id <> ? 
       LIMIT 1`,
      [nextEmail, id, nextUsername, id]
    );
    if (conflicts.length) {
      await connection.rollback();
      return res.status(400).json({ message: 'Email or username already exists.' });
    }

    // Update users table
    await connection.query(
      'UPDATE users SET name = ?, username = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [nextName, nextUsername, nextEmail, id]
    );

    // Check if user_interests row exists for this user
    const [interestRows] = await connection.query(
      'SELECT user_id FROM user_interests WHERE user_id = ?',
      [id]
    );

    const creditCardLast4 = extractCreditCardLast4(creditCard);

    if (interestRows.length === 0) {
      // No interests row yet (e.g. user registered via /register) → INSERT one
      await connection.query(
        `
        INSERT INTO user_interests
        (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          id,
          sanitizeValue(mobile),
          creditCardLast4,
          sanitizeValue(state),
          sanitizeValue(city),
          gender || 'Male',
          JSON.stringify(hobbies || []),
          JSON.stringify(techInterests || []),
          sanitizeValue(address),
          sanitizeValue(dob)
        ]
      );
    } else {
      // Update existing interests row
      await connection.query(
        `
        UPDATE user_interests 
        SET mobile = ?, credit_card_last4 = ?, state = ?, city = ?, gender = ?, 
            hobbies = ?, tech_interests = ?, address = ?, dob = ?
        WHERE user_id = ?
      `,
        [
          sanitizeValue(mobile),
          creditCardLast4,
          sanitizeValue(state),
          sanitizeValue(city),
          gender || 'Male',
          JSON.stringify(hobbies || []),
          JSON.stringify(techInterests || []),
          sanitizeValue(address),
          sanitizeValue(dob),
          id
        ]
      );
    }

    await connection.commit();

    return res.json({ message: 'User updated successfully' });
  } catch (err) {
    try { await connection.rollback(); } catch {}
    console.error('Error updating user:', err.message);
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Email or username already exists.' });
    }
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  } finally {
    connection.release();
  }
};

// Delete user
const deleteUser = (pool) => async (req, res) => {
  try {
    const { id } = req.params;

    // Foreign key constraint will automatically delete user_interests
    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    return res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    return res.status(500).json({
      message: 'Internal server error: ' + err.message
    });
  }
};

// Chart aggregation endpoints - optimized queries
const getStateDistribution = (pool) => async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COALESCE(ui.state, 'Unknown') as label,
        COUNT(*) as value
      FROM users u
      LEFT JOIN user_interests ui ON u.id = ui.user_id
      WHERE ui.state IS NOT NULL
      GROUP BY ui.state
      ORDER BY value DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error('Error fetching state distribution:', err.message);
    return res.status(500).json({ message: 'Internal server error: ' + err.message });
  }
};

const getHobbiesDistribution = (pool) => async (_req, res) => {
  try {
    // MySQL 8.0+ JSON_TABLE approach for optimal performance(JSON_TABLE is a feature that lets you treat elements of a JSON array as rows in a virtual table.)
    const [rows] = await pool.query(`
      SELECT 
        hobby as label,
        COUNT(*) as value
      FROM users u
      INNER JOIN user_interests ui ON u.id = ui.user_id
      CROSS JOIN JSON_TABLE(
        ui.hobbies,
        '$[*]' COLUMNS (hobby VARCHAR(100) PATH '$')
      ) AS jt
      WHERE ui.hobbies IS NOT NULL AND JSON_LENGTH(ui.hobbies) > 0
      GROUP BY hobby
      ORDER BY value DESC
    `);
    return res.json(rows);
  } catch (err) {
    // Fallback for older MySQL versions
    try {
      const [allRows] = await pool.query(`
        SELECT hobbies FROM user_interests WHERE hobbies IS NOT NULL AND JSON_LENGTH(hobbies) > 0
      `);
      const hobbyCounts = {};
      allRows.forEach((row) => {
        const hobbies = parseJsonField(row.hobbies);
        if (Array.isArray(hobbies)) {
          hobbies.forEach((h) => {
            hobbyCounts[h] = (hobbyCounts[h] || 0) + 1;
          });
        }
      });
      const result = Object.entries(hobbyCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
      return res.json(result);
    } catch (fallbackErr) {
      console.error('Error fetching hobbies distribution:', err.message);
      return res.status(500).json({ message: 'Internal server error: ' + err.message });
    }
  }
};

const getTechInterestsDistribution = (pool) => async (_req, res) => {
  try {
    // MySQL 8.0+ JSON_TABLE approach for optimal performance
    const [rows] = await pool.query(`
      SELECT 
        tech as label,
        COUNT(*) as value
      FROM users u
      INNER JOIN user_interests ui ON u.id = ui.user_id
      CROSS JOIN JSON_TABLE(
        ui.tech_interests,
        '$[*]' COLUMNS (tech VARCHAR(100) PATH '$')
      ) AS jt
      WHERE ui.tech_interests IS NOT NULL AND JSON_LENGTH(ui.tech_interests) > 0
      GROUP BY tech
      ORDER BY value DESC
    `);
    return res.json(rows);
  } catch (err) {
    // Fallback for older MySQL versions
    try {
      const [allRows] = await pool.query(`
        SELECT tech_interests FROM user_interests WHERE tech_interests IS NOT NULL AND JSON_LENGTH(tech_interests) > 0
      `);
      const techCounts = {};
      allRows.forEach((row) => {
        const techs = parseJsonField(row.tech_interests);
        if (Array.isArray(techs)) {
          techs.forEach((t) => {
            techCounts[t] = (techCounts[t] || 0) + 1;
          });
        }
      });
      const result = Object.entries(techCounts)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
      return res.json(result);
    } catch (fallbackErr) {
      console.error('Error fetching tech interests distribution:', err.message);
      return res.status(500).json({ message: 'Internal server error: ' + err.message });
    }
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getStateDistribution,
  getHobbiesDistribution,
  getTechInterestsDistribution
};

