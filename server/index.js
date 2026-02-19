const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// API routes (support both /api and /sumit/api for deployment)
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/sumit/api/auth', authRoutes);
app.use('/sumit/api/hotels', hotelRoutes);
app.use('/sumit/api/bookings', bookingRoutes);

// Serve static frontend in production
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use('/sumit', express.static(clientBuildPath));
app.use(express.static(clientBuildPath));
app.get('/sumit/*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
