const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/auth');
const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// POST /api/bookings — Create a booking
router.post('/', async (req, res) => {
  try {
    const { room_id, hotel_id, check_in, check_out, guests } = req.body;
    const user_id = req.user.id;

    if (!room_id || !hotel_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'room_id, hotel_id, check_in, and check_out are required.' });
    }

    if (new Date(check_in) >= new Date(check_out)) {
      return res.status(400).json({ error: 'check_out must be after check_in.' });
    }

    if (new Date(check_in) < new Date(new Date().toDateString())) {
      return res.status(400).json({ error: 'check_in cannot be in the past.' });
    }

    // Verify room exists and belongs to hotel
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1 AND hotel_id = $2', [room_id, hotel_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    const room = roomResult.rows[0];

    // Check availability
    const bookedResult = await pool.query(`
      SELECT COUNT(*) AS count FROM bookings
      WHERE room_id = $1 AND status = 'confirmed'
        AND check_in < $3 AND check_out > $2
    `, [room_id, check_in, check_out]);

    const bookedCount = parseInt(bookedResult.rows[0].count);
    if (bookedCount >= room.total_rooms) {
      return res.status(409).json({ error: 'No rooms available for the selected dates.' });
    }

    // Calculate total price
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    const total_price = (nights * parseFloat(room.price)).toFixed(2);

    const result = await pool.query(`
      INSERT INTO bookings (user_id, room_id, hotel_id, check_in, check_out, guests, total_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
      RETURNING *
    `, [user_id, room_id, hotel_id, check_in, check_out, guests || 1, total_price]);

    // Fetch hotel and room details for response
    const booking = result.rows[0];
    const hotelResult = await pool.query('SELECT name, location FROM hotels WHERE id = $1', [hotel_id]);
    const roomDetail = await pool.query('SELECT room_type FROM rooms WHERE id = $1', [room_id]);

    res.status(201).json({
      message: 'Booking confirmed!',
      booking: {
        ...booking,
        hotel_name: hotelResult.rows[0].name,
        hotel_location: hotelResult.rows[0].location,
        room_type: roomDetail.rows[0].room_type,
        nights
      }
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/bookings — Get user's bookings
router.get('/', async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(`
      SELECT b.*, h.name AS hotel_name, h.location AS hotel_location, h.image_url AS hotel_image,
             r.room_type, r.price AS room_price
      FROM bookings b
      JOIN hotels h ON h.id = b.hotel_id
      JOIN rooms r ON r.id = b.room_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [user_id]);

    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/bookings/:id/cancel — Cancel a booking
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status = 'confirmed' RETURNING *",
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already cancelled.' });
    }

    res.json({ message: 'Booking cancelled.', booking: result.rows[0] });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
