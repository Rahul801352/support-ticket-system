const pool = require('../config/database');

async function getStats(req, res) {
  try {
    const [totalRows] = await pool.execute('SELECT COUNT(*) AS total FROM tickets');
    const [openRows] = await pool.execute("SELECT COUNT(*) AS open FROM tickets WHERE status = 'open'");
    const [inProgressRows] = await pool.execute("SELECT COUNT(*) AS in_progress FROM tickets WHERE status = 'in_progress'");
    const [closedRows] = await pool.execute("SELECT COUNT(*) AS closed FROM tickets WHERE status = 'closed'");
    const [highPriorityRows] = await pool.execute("SELECT COUNT(*) AS high_priority FROM tickets WHERE priority = 'high'");

    return res.status(200).json({
      total: totalRows[0].total || 0,
      open: openRows[0].open || 0,
      in_progress: inProgressRows[0].in_progress || 0,
      closed: closedRows[0].closed || 0,
      high_priority: highPriorityRows[0].high_priority || 0
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket statistics' });
  }
}

async function getTickets(req, res) {
  try {
    const isAgent = req.user.role === 'agent';
    const { search, status, priority, sort, order } = req.query;

    let baseSql = `
      SELECT 
        tickets.id,
        tickets.user_id,
        tickets.subject,
        tickets.description,
        tickets.priority,
        tickets.status,
        tickets.assigned_to,
        tickets.created_at,
        tickets.updated_at,
        customer.name AS customer_name,
        customer.email AS customer_email,
        agent.name AS assigned_agent_name
      FROM tickets
      JOIN users AS customer ON tickets.user_id = customer.id
      LEFT JOIN users AS agent ON tickets.assigned_to = agent.id
    `;

    const conditions = [];
    const params = [];

    if (!isAgent) {
      conditions.push('tickets.user_id = ?');
      params.push(req.user.id);
    }

    if (status) {
      conditions.push('tickets.status = ?');
      params.push(status);
    }

    if (priority) {
      conditions.push('tickets.priority = ?');
      params.push(priority);
    }

    if (search) {
      conditions.push('(tickets.subject LIKE ? OR tickets.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      baseSql += ' WHERE ' + conditions.join(' AND ');
    }

    const validSortFields = ['created_at', 'updated_at', 'priority', 'status', 'subject', 'id'];
    const sortField = validSortFields.includes(sort) ? `tickets.${sort}` : 'tickets.created_at';
    const sortOrder = (order && order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    baseSql += ` ORDER BY ${sortField} ${sortOrder}`;

    const [rows] = await pool.execute(baseSql, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Get Tickets Error:', error);
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
}

async function createTicket(req, res) {
  try {
    const { subject, description, priority } = req.body;

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const validPriorities = ['low', 'medium', 'high'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';
    const userId = req.user.id;

    const [result] = await pool.execute(
      'INSERT INTO tickets (user_id, subject, description, priority, status) VALUES (?, ?, ?, ?, ?)',
      [userId, subject.trim(), description.trim(), ticketPriority, 'open']
    );

    return res.status(201).json({
      message: 'Ticket created successfully',
      id: result.insertId,
      ticket: {
        id: result.insertId,
        user_id: userId,
        subject: subject.trim(),
        description: description.trim(),
        priority: ticketPriority,
        status: 'open'
      }
    });
  } catch (error) {
    console.error('Create Ticket Error:', error);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
}

async function getTicketById(req, res) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    const sql = `
      SELECT 
        tickets.id,
        tickets.user_id,
        tickets.subject,
        tickets.description,
        tickets.priority,
        tickets.status,
        tickets.assigned_to,
        tickets.created_at,
        tickets.updated_at,
        customer.name AS customer_name,
        customer.email AS customer_email,
        agent.name AS assigned_agent_name,
        agent.email AS assigned_agent_email
      FROM tickets
      JOIN users AS customer ON tickets.user_id = customer.id
      LEFT JOIN users AS agent ON tickets.assigned_to = agent.id
      WHERE tickets.id = ?
    `;

    const [rows] = await pool.execute(sql, [ticketId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticket = rows[0];

    if (req.user.role !== 'agent' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to view this ticket' });
    }

    return res.status(200).json(ticket);
  } catch (error) {
    console.error('Get Ticket ID Error:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket details' });
  }
}

async function updateTicket(req, res) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    const [existing] = await pool.execute('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const currentTicket = existing[0];
    const { status, priority, assigned_to } = req.body;

    const validStatuses = ['open', 'in_progress', 'closed'];
    const validPriorities = ['low', 'medium', 'high'];

    const newStatus = (status && validStatuses.includes(status)) ? status : currentTicket.status;
    const newPriority = (priority && validPriorities.includes(priority)) ? priority : currentTicket.priority;

    let newAssignedTo = currentTicket.assigned_to;
    if (assigned_to === null || assigned_to === '' || assigned_to === 0) {
      newAssignedTo = null;
    } else if (assigned_to !== undefined) {
      const parsedAssigned = parseInt(assigned_to, 10);
      newAssignedTo = isNaN(parsedAssigned) ? currentTicket.assigned_to : parsedAssigned;
    }

    await pool.execute(
      'UPDATE tickets SET status = ?, priority = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, newPriority, newAssignedTo, ticketId]
    );

    return res.status(200).json({
      message: 'Ticket updated successfully',
      ticket: {
        id: ticketId,
        status: newStatus,
        priority: newPriority,
        assigned_to: newAssignedTo
      }
    });
  } catch (error) {
    console.error('Update Ticket Error:', error);
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
}

async function deleteTicket(req, res) {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID format' });
    }

    const [existing] = await pool.execute('SELECT id FROM tickets WHERE id = ?', [ticketId]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    await pool.execute('DELETE FROM tickets WHERE id = ?', [ticketId]);
    return res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete Ticket Error:', error);
    return res.status(500).json({ error: 'Failed to delete ticket' });
  }
}

module.exports = {
  getStats,
  getTickets,
  createTicket,
  getTicketById,
  updateTicket,
  deleteTicket
};
