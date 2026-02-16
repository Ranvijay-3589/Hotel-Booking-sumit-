const express = require('express');
const { body } = require('express-validator');
const { createBooking, getMyBookings } = require('../controllers/bookingController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  auth,
  [
    body('roomId').isInt().withMessage('Room ID is required'),
    body('checkIn').isDate().withMessage('Valid check-in date is required'),
    body('checkOut').isDate().withMessage('Valid check-out date is required'),
    body('guests').isInt({ min: 1 }).withMessage('At least 1 guest is required'),
  ],
  createBooking
);

router.get('/my', auth, getMyBookings);

module.exports = router;
