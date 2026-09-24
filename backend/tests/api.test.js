process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');

describe('Support Ticket System API Integration Tests', () => {
  let customerToken = '';
  let customerId = null;
  let customer2Token = '';
  let customer2Id = null;
  let agentToken = '';
  let agentId = null;
  let createdTicketId = null;

  beforeAll(async () => {
    // 1. Register Customer 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Customer',
        email: 'alice@example.com',
        password: 'Password123!'
      });
    expect(res1.statusCode).toBe(201);
    customerId = res1.body.id;

    // 2. Register Customer 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Customer',
        email: 'bob@example.com',
        password: 'Password123!'
      });
    expect(res2.statusCode).toBe(201);
    customer2Id = res2.body.id;

    // 3. Register Agent (Manually set role for testing)
    const pool = require('../db');
    const bcrypt = require('bcrypt');
    const agentHash = await bcrypt.hash('Password123!', 10);
    const [agentRes] = await pool.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES ('Support Agent Smith', 'agent.smith@example.com', ?, 'agent')",
      [agentHash]
    );
    agentId = agentRes.insertId;

    // Login Customer 1
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123!' });
    customerToken = login1.body.token;

    // Login Customer 2
    const login2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@example.com', password: 'Password123!' });
    customer2Token = login2.body.token;

    // Login Agent
    const loginAgent = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent.smith@example.com', password: 'Password123!' });
    agentToken = loginAgent.body.token;
  });

  describe('1. Authentication APIs', () => {
    it('1.1 Should register a new customer successfully (201)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Charlie Customer',
          email: 'charlie@example.com',
          password: 'Password123!'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.user.role).toBe('customer');
    });

    it('1.2 Should reject duplicate registration (400)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Duplicate',
          email: 'alice@example.com',
          password: 'Password123!'
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/already be registered/i);
    });

    it('1.3 Should login successfully with valid credentials (200)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Password123!'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('customer');
    });

    it('1.4 Should reject login with invalid password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'WrongPassword'
        });
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('1.5 Should reject protected routes without token (401)', async () => {
      const res = await request(app).get('/api/tickets');
      expect(res.statusCode).toBe(401);
      expect(res.body.error).toMatch(/No authentication token/i);
    });
  });

  describe('2. Ticket Management & Ownership APIs', () => {
    it('2.1 Should create ticket successfully for authenticated customer (201)', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          subject: 'Printer not working',
          description: 'The office printer on floor 2 gives error code 502.',
          priority: 'high'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      createdTicketId = res.body.id;
    });

    it('2.2 Should fetch customer\'s own tickets (200)', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].subject).toBe('Printer not working');
    });

    it('2.3 Should forbid Customer 2 from viewing Customer 1\'s ticket (403)', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${customer2Token}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/Forbidden/i);
    });

    it('2.4 Should allow Agent to view any ticket (200)', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(createdTicketId);
    });

    it('2.5 Should allow Agent to update ticket status, priority, assignment (200)', async () => {
      const res = await request(app)
        .put(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${agentToken}`)
        .send({
          status: 'in_progress',
          priority: 'high',
          assigned_to: agentId
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.ticket.status).toBe('in_progress');
      expect(res.body.ticket.assigned_to).toBe(agentId);
    });

    it('2.6 Should forbid Customer from updating ticket status (403)', async () => {
      const res = await request(app)
        .put(`/api/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'closed' });
      expect(res.statusCode).toBe(403);
    });

    it('2.7 Should return 404 for non-existent ticket ID', async () => {
      const res = await request(app)
        .get('/api/tickets/999999')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Ticket not found');
    });
  });

  describe('3. Ticket Comments & Statistics APIs', () => {
    it('3.1 Should allow Customer to comment on own ticket (201)', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ comment: 'Please send an IT technician.' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.comment.comment).toBe('Please send an IT technician.');
    });

    it('3.2 Should allow Agent to view comments for ticket (200)', async () => {
      const res = await request(app)
        .get(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('3.3 Should forbid Customer 2 from commenting on Customer 1\'s ticket (403)', async () => {
      const res = await request(app)
        .post(`/api/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ comment: 'Unauthorized comment attempt' });
      expect(res.statusCode).toBe(403);
    });

    it('3.4 Should allow Agent to view ticket stats (200)', async () => {
      const res = await request(app)
        .get('/api/tickets/stats')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('open');
      expect(res.body).toHaveProperty('in_progress');
      expect(res.body).toHaveProperty('closed');
    });

    it('3.5 Should allow Agent to list users for ticket assignment (200)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${agentToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
