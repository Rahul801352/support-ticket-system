const pool = require('../config/database');

async function getComments(req, res) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    const [tickets] = await pool.execute('SELECT user_id FROM tickets WHERE id = ?', [ticketId]);
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user.role !== 'agent' && tickets[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view these comments' });
    }

    const sql = `
      SELECT 
        ticket_comments.id,
        ticket_comments.ticket_id,
        ticket_comments.user_id,
        ticket_comments.comment,
        ticket_comments.created_at,
        users.name AS user_name,
        users.role AS user_role
      FROM ticket_comments
      JOIN users ON ticket_comments.user_id = users.id
      WHERE ticket_comments.ticket_id = ?
      ORDER BY ticket_comments.created_at ASC
    `;

    const [comments] = await pool.execute(sql, [ticketId]);
    return res.status(200).json(comments);
  } catch (error) {
    console.error('Get Comments Error:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

async function addComment(req, res) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    const { comment } = req.body;
    if (!comment || typeof comment !== 'string' || !comment.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    const [tickets] = await pool.execute('SELECT user_id FROM tickets WHERE id = ?', [ticketId]);
    if (tickets.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (req.user.role !== 'agent' && tickets[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You cannot comment on another user\'s ticket' });
    }

    const userId = req.user.id;
    const [result] = await pool.execute(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES (?, ?, ?)',
      [ticketId, userId, comment.trim()]
    );

    await pool.execute('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [ticketId]);

    return res.status(201).json({
      message: 'Comment added successfully',
      id: result.insertId,
      comment: {
        id: result.insertId,
        ticket_id: ticketId,
        user_id: userId,
        comment: comment.trim(),
        user_name: req.user.name,
        user_role: req.user.role,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Add Comment Error:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
}

module.exports = {
  getComments,
  addComment
};
