const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Could not create user (email may already be registered)' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const role = 'customer';

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [trimmedName, trimmedEmail, passwordHash, role]
    );

    return res.status(201).json({
      message: 'User registered successfully',
      id: result.insertId,
      user: {
        id: result.insertId,
        name: trimmedName,
        email: trimmedEmail,
        role
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('already be registered')) {
      return res.status(400).json({ error: 'Could not create user (email may already be registered)' });
    }
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Server error during registration' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email.trim().toLowerCase();

    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_support_ticket_system_2026';
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, secret, { expiresIn: '1d' });

    return res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Server error during login' });
  }
}

async function getMe(req, res) {
  try {
    const [users] = await pool.execute('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(users[0]);
  } catch (error) {
    console.error('Fetch Me Error:', error);
    return res.status(500).json({ error: 'Server error fetching user details' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
