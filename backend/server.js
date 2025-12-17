require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createPool, initializeDatabase } = require('./config/database');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// Create database pool
const pool = createPool();

// Initialize database
initializeDatabase(pool);

// Import routes
const authRoutes = require('./routes/authRoutes')(pool);
const userRoutes = require('./routes/userRoutes')(pool);

// Use routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`✓ Backend server running on port ${port}`);
});
