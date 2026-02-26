const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5003;
const BASE = '/sumit';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files at both root and /sumit
app.use(BASE, express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// API routes mounted at both /api and /sumit/api
app.use(`${BASE}/api/auth`, authRoutes);
app.use(`${BASE}/api/hotels`, hotelRoutes);
app.use(`${BASE}/api/bookings`, bookingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use(`${BASE}/api/stats`, statsRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get(`${BASE}/api/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Hello check
app.get(`${BASE}/api/hello`, (req, res) => {
  res.json({ message: 'hello' });
});
app.get('/api/hello', (req, res) => {
  res.json({ message: 'hello' });
});

// SPA fallback for non-API routes
app.get('*', (req, res) => {
  if (!req.path.includes('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Hotel Booking server running on port ${PORT}`);
});

module.exports = app;
