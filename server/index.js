const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Strip subpath prefix if present (handles proxy path rewriting)
// The deployed site at ranvijay.capricorn.online/sumit/ may forward
// requests with /sumit/ prefix intact. This strips it so routes match.
app.use((req, res, next) => {
  if (req.url.startsWith('/sumit/') || req.url === '/sumit') {
    req.url = req.url.replace(/^\/sumit/, '') || '/';
  }
  next();
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Handle JSON parse errors (must be after routes, 4-param = error handler)
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next(err);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    return server;
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Only start the server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
