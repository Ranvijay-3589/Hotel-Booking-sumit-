const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings - create a booking
router.post('/', auth, async (req, res) => {
  try {
    const { room_id, hotel_id, check_in, check_out, guests } = req.body;
    const user_id = req.user.id;

    if (!room_id || !hotel_id || !check_in || !check_out) {
      return res.status(400).json({ message: 'Please provide room_id, hotel_id, check_in, and check_out' });
    }

    // Validate dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // Get room details
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1 AND hotel_id = $2', [room_id, hotel_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = roomResult.rows[0];

    // Check availability: count overlapping bookings
    const overlapResult = await pool.query(
      `SELECT COUNT(*) as booked FROM bookings
       WHERE room_id = $1 AND status = 'confirmed'
       AND check_in < $3 AND check_out > $2`,
      [room_id, check_in, check_out]
    );

    const booked = parseInt(overlapResult.rows[0].booked, 10);
    if (booked >= room.total_rooms) {
      return res.status(400).json({ message: 'No rooms available for the selected dates' });
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const total_price = nights * parseFloat(room.price);

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (user_id, room_id, hotel_id, check_in, check_out, guests, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, room_id, hotel_id, check_in, check_out, guests || 1, total_price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/my - get user's bookings
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, h.name as hotel_name, h.location as hotel_location, h.image_url,
              r.room_type, r.price as room_price
       FROM bookings b
       JOIN hotels h ON h.id = b.hotel_id
       JOIN rooms r ON r.id = b.room_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get bookings error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
