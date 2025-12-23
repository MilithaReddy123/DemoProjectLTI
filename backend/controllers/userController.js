const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Helper function to sanitize string values (null/empty string handling)
const sanitizeValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  return String(value).trim();
};

// Helper function to parse JSON fields
const parseJsonField = (field) => {
  if (!field) return [];
  return typeof field === 'string' ? JSON.parse(field) : field;
};

// Helper function to extract credit card last 4 digits
const extractCreditCardLast4 = (creditCard) => {
  if (!creditCard) return null;
  const digitsOnly = creditCard.replace(/\D/g, '');
  return digitsOnly.length >= 4 ? digitsOnly.slice(-4) : null;
};

// Helper function to format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return null;
  return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
};

// List all users with joined interests
const getAllUsers = (pool) => async (req, res) => {
  try {
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
    `);

    const users = rows.map((r) => {
      const creditCardLast4 = sanitizeValue(r.credit_card_last4);
      
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
        dob: sanitizeValue(r.dob)
      };
    });


    return res.json(users);
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
      dob: sanitizeValue(user.dob)
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
      await connection.release();
      return res.status(400).json({
        message:
          'Required fields: name, email, mobile, state, city, username, password'
      });
    }

    if (!Array.isArray(hobbies) || hobbies.length === 0) {
      await connection.release();
      return res.status(400).json({
        message: 'Please select at least one hobby'
      });
    }

    if (!Array.isArray(techInterests) || techInterests.length === 0) {
      await connection.release();
      return res.status(400).json({
        message: 'Please select at least one tech interest'
      });
    }

    await connection.beginTransaction();

    // Check if user exists by username or email
    const [existing] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existing.length > 0) {
      await connection.rollback();
      await connection.release();
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
    await connection.rollback();
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

    // Update users table
    await connection.query(
      'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, email, id]
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
    await connection.rollback();
    console.error('Error updating user:', err.message);
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

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

