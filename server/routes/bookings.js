const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings - create a booking
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { room_id, check_in, check_out, rooms_booked, guests } = req.body;
    let { hotel_id } = req.body;
    const userId = req.user.id;
    const numRooms = parseInt(rooms_booked) || parseInt(guests) || 1;

    if (!room_id || !check_in || !check_out) {
      return res.status(400).json({ message: 'room_id, check_in, and check_out are required' });
    }

    await client.query('BEGIN');

    // Look up the room (and hotel_id if not provided)
    let roomResult;
    if (hotel_id) {
      roomResult = await client.query('SELECT * FROM rooms WHERE id = $1 AND hotel_id = $2', [room_id, hotel_id]);
    } else {
      roomResult = await client.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
    }

    if (roomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = roomResult.rows[0];
    hotel_id = room.hotel_id;

    // Calculate total price
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    const totalPrice = parseFloat(room.price) * nights * numRooms;

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, room_id, hotel_id, check_in, check_out, guests, rooms_booked, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'requested')
       RETURNING *`,
      [userId, room_id, hotel_id, check_in, check_out, numRooms, numRooms, totalPrice]
    );

    // Decrease available rooms
    await client.query(
      'UPDATE rooms SET available_rooms = GREATEST(available_rooms - $1, 0) WHERE id = $2',
      [numRooms, room_id]
    );

    await client.query('COMMIT');

    // Fetch hotel name and location for response
    const hotelResult = await pool.query('SELECT name, location FROM hotels WHERE id = $1', [hotel_id]);

    const booking = bookingResult.rows[0];
    res.status(201).json({
      booking: {
        ...booking,
        hotel_name: hotelResult.rows[0]?.name || '',
        hotel_location: hotelResult.rows[0]?.location || '',
        room_type: room.room_type,
        price_per_night: room.price,
        rooms_booked: numRooms,
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
              r.room_type, r.price AS price_per_night
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

// POST /api/bookings/update/:id - update a booking
router.post('/update/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { checkIn, check_in, checkOut, check_out, rooms_booked } = req.body;

    const ci = checkIn || check_in;
    const co = checkOut || check_out;

    if (!ci || !co) {
      return res.status(400).json({ message: 'check_in and check_out are required' });
    }

    // Verify booking belongs to user
    const existing = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = existing.rows[0];

    // Recalculate total price
    const room = await pool.query('SELECT * FROM rooms WHERE id = $1', [booking.room_id]);
    const numRooms = parseInt(rooms_booked) || booking.rooms_booked || 1;
    const nights = Math.max(1, Math.ceil((new Date(co) - new Date(ci)) / (1000 * 60 * 60 * 24)));
    const totalPrice = parseFloat(room.rows[0]?.price || 0) * nights * numRooms;

    const result = await pool.query(
      `UPDATE bookings SET check_in = $1, check_out = $2, rooms_booked = $3, guests = $3, total_price = $4
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [ci, co, numRooms, totalPrice, id, userId]
    );

    res.json({ booking: result.rows[0], message: 'Booking updated successfully' });
  } catch (err) {
    console.error('Update booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings/delete/:id - delete a booking
router.post('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify booking belongs to user
    const existing = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = existing.rows[0];

    // Restore available rooms
    await pool.query(
      'UPDATE rooms SET available_rooms = available_rooms + $1 WHERE id = $2',
      [booking.rooms_booked || 1, booking.room_id]
    );

    await pool.query('DELETE FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings/:id/confirm - confirm a booking
router.post('/:id/confirm', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify booking belongs to user
    const existing = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, userId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const result = await pool.query(
      `UPDATE bookings SET status = 'confirmed' WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId]
    );

    res.json({ booking: result.rows[0], message: 'Booking confirmed successfully' });
  } catch (err) {
    console.error('Confirm booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
