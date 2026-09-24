require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON payloads
app.use(express.json());

// Health Check API Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Support Ticket System API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// Centralized 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: 'API Endpoint Not Found' });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

// Start listening only when executed directly (allows Jest / Supertest imports)
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Support Ticket System API server running on port ${PORT}`);
  });
}

module.exports = app;
