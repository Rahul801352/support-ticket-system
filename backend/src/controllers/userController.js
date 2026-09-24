const pool = require('../config/database');

async function getUsers(req, res) {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY role DESC, name ASC'
    );
    return res.status(200).json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

module.exports = {
  getUsers
};
