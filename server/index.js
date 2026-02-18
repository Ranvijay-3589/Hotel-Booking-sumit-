require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

// Fallback: if body is a string (from text parser), try to parse as JSON
app.use((req, res, next) => {
  if (typeof req.body === 'string' && req.body.trim().startsWith('{')) {
    try { req.body = JSON.parse(req.body); } catch (e) { /* keep as string */ }
  }
  next();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve static frontend from public directory
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Also serve client/build as fallback
const clientBuild = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuild));

// Fallback: serve hotels.html as the default page
app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'hotels.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
