const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings - create a booking
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { room_id, hotel_id, check_in, check_out, guests } = req.body;
    const userId = req.user.id;

    if (!room_id || !hotel_id || !check_in || !check_out) {
      return res.status(400).json({ message: 'room_id, hotel_id, check_in, and check_out are required' });
    }

    await client.query('BEGIN');

    // Check room availability
    const roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 AND hotel_id = $2', [room_id, hotel_id]);
    if (roomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = roomResult.rows[0];
    if (room.available_rooms <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No rooms available' });
    }

    // Calculate total price
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const totalPrice = parseFloat(room.price) * nights;

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, room_id, hotel_id, check_in, check_out, guests, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed')
       RETURNING *`,
      [userId, room_id, hotel_id, check_in, check_out, guests || 1, totalPrice]
    );

    // Decrease available rooms
    await client.query(
      'UPDATE rooms SET available_rooms = available_rooms - 1 WHERE id = $1',
      [room_id]
    );

    await client.query('COMMIT');

    // Fetch hotel name for response
    const hotelResult = await pool.query('SELECT name FROM hotels WHERE id = $1', [hotel_id]);

    res.status(201).json({
      booking: {
        ...bookingResult.rows[0],
        hotel_name: hotelResult.rows[0]?.name,
        room_type: room.room_type,
        nights,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/bookings/my - user's bookings
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, h.name AS hotel_name, h.location AS hotel_location, h.image_url,
              r.room_type, r.price AS room_price
       FROM bookings b
       JOIN hotels h ON h.id = b.hotel_id
       JOIN rooms r ON r.id = b.room_id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get bookings error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
