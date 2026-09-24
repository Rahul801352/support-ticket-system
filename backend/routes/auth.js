const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticate } = require('../middleware/auth');

// Email regex pattern for input validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @route   POST /api/auth/register
 * @desc    Register a new customer account
 * @access  Public
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    // 2. Check if user already exists
    const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ?', [trimmedEmail]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Could not create user (email may already be registered)' });
    }

    // 3. Hash password (bcrypt 10 rounds)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Force role to 'customer' regardless of req.body.role (Security Rule)
    const role = 'customer';

    // 5. Insert into DB using parameterized query
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
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Fetch user by email
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [trimmedEmail]);
    if (users.length === 0) {
      // Deliberately generic error message to prevent account enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Issue JWT Token containing user id, email, name, role
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
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated user details
 * @access  Authenticated
 */
router.get('/me', authenticate, async (req, res) => {
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
});

module.exports = router;
