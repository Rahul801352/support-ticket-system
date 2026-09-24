require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse incoming JSON payloads
app.use(express.json());

// Health Check API Endpoint
const healthCheck = (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Support Ticket System API', timestamp: new Date().toISOString() });
};
app.get('/api/health', healthCheck);
app.get('/health', healthCheck);

// API Routes (Mounted at both /api/ and / for maximum URL compatibility)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/tickets', ticketRoutes);
app.use('/tickets', ticketRoutes);

app.use('/api/users', userRoutes);
app.use('/users', userRoutes);

// Centralized 404 Route Handler
app.use(notFoundHandler);

// Centralized Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
