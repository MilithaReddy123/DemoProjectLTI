const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

module.exports = (pool) => {
  
  // Get all users (joined with user_interests)
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          u.id,
          u.name,
          u.email,
          u.username,
          u.created_at,
          ui.mobile,
          ui.state,
          ui.city,
          ui.gender,
          ui.hobbies,
          ui.tech_interests,
          ui.dob
        FROM users u
        LEFT JOIN user_interests ui ON u.id = ui.user_id
        ORDER BY u.created_at DESC
      `);

      const users = rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        username: r.username,
        mobile: r.mobile || '',
        state: r.state || '',
        city: r.city || '',
        gender: r.gender || 'Male',
        hobbies: r.hobbies || [],
        techInterests: r.tech_interests || [],
        dob: r.dob || ''
      }));

      return res.json(users);
    } catch (err) {
      console.error('Error fetching users:', err.message);
      return res.status(500).json({ 
        message: 'Internal server error: ' + err.message 
      });
    }
  });

  // Get single user by ID (joined)
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const [rows] = await pool.query(`
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
      `, [id]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const user = rows[0];
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        mobile: user.mobile || '',
        creditCard: user.credit_card_last4 ? '************' + user.credit_card_last4 : '',
        state: user.state || '',
        city: user.city || '',
        gender: user.gender || 'Male',
        hobbies: user.hobbies || [],
        techInterests: user.tech_interests || [],
        address: user.address || '',
        dob: user.dob || ''
      });
    } catch (err) {
      console.error('Error fetching user:', err.message);
      return res.status(500).json({ 
        message: 'Internal server error: ' + err.message 
      });
    }
  });

  // Create new user
  router.post('/', async (req, res) => {
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

      console.log('Received registration data:', {
        name, email, mobile, state, city, gender, username, 
        hobbies: hobbies?.length, techInterests: techInterests?.length, hasDob: !!dob
      });

      // Validate required fields
      if (!name || !email || !mobile || !state || !city || !username || !password) {
        await connection.release();
        return res.status(400).json({ 
          message: 'Required fields: name, email, mobile, state, city, username, password' 
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

      // Check if user exists
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
      const passwordHash = await bcrypt.hash(password, 10);

      // Insert into users table
      await connection.query(
        'INSERT INTO users (id, name, email, username, password_hash) VALUES (?, ?, ?, ?, ?)',
        [userId, name, email, username, passwordHash]
      );

      // Insert into user_interests table
      const creditCardLast4 = creditCard ? creditCard.slice(-4) : null;
      
      await connection.query(`
        INSERT INTO user_interests 
        (user_id, mobile, credit_card_last4, state, city, gender, hobbies, tech_interests, address, dob)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        mobile,
        creditCardLast4,
        state,
        city,
        gender || 'Male',
        JSON.stringify(hobbies),
        JSON.stringify(techInterests),
        address || '',
        dob || null
      ]);

      await connection.commit();

      console.log('✓ User created successfully:', username);

      return res.status(201).json({ 
        message: 'User created successfully', 
        id: userId 
      });
    } catch (err) {
      await connection.rollback();
      console.error('Error creating user:', err.message);
      console.error('Full error:', err);
      return res.status(500).json({ 
        message: 'Internal server error: ' + err.message 
      });
    } finally {
      connection.release();
    }
  });

  // Update user
  router.put('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
      const { id } = req.params;
      const {
        name,
        email,
        mobile,
        state,
        city,
        gender,
        hobbies,
        techInterests,
        address
      } = req.body;

      await connection.beginTransaction();

      // Update users table
      await connection.query(
        'UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, email, id]
      );

      // Update user_interests table
      await connection.query(`
        UPDATE user_interests 
        SET mobile = ?, state = ?, city = ?, gender = ?, 
            hobbies = ?, tech_interests = ?, address = ?
        WHERE user_id = ?
      `, [
        mobile,
        state,
        city,
        gender,
        JSON.stringify(hobbies || []),
        JSON.stringify(techInterests || []),
        address || '',
        id
      ]);

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
  });

  // Delete user
  router.delete('/:id', async (req, res) => {
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
  });

  return router;
};

