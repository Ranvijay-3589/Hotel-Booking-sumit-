const path = require('path');
const express = require('express');
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const bookingRoutes = require('./routes/bookings');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.use('/api/auth', authRoutes);
  app.use('/api/hotels', hotelRoutes);
  app.use('/api/bookings', bookingRoutes);

  app.get('/', (req, res) => res.redirect('/login.html'));
  app.get('/register', (req, res) => res.redirect('/register.html'));
  app.get('/login', (req, res) => res.redirect('/login.html'));
  app.get('/hotels', (req, res) => res.redirect('/hotels.html'));
  app.get('/hotel/:id', (req, res) => res.redirect(`/hotel.html?id=${req.params.id}`));
  app.get('/booking/confirmation', (req, res) => res.redirect('/booking-confirmation.html'));
  app.get('/my-bookings', (req, res) => res.redirect('/my-bookings.html'));

  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  return app;
}

module.exports = { createApp };
