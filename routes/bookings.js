const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/auth');
const router = express.Router();

// All booking routes require authentication
router.use(authenticate);

// POST /api/bookings — Create a booking (status = 'requested')
router.post('/', async (req, res) => {
  try {
    // Accept both body and query params (hotel.html sends query params too)
    const room_id = req.body.room_id || req.query.room_id;
    let hotel_id = req.body.hotel_id || req.query.hotel_id;
    const check_in = req.body.check_in || req.body.checkIn || req.query.check_in;
    const check_out = req.body.check_out || req.body.checkOut || req.query.check_out;
    const guests = req.body.guests || req.body.rooms_booked || req.query.rooms_booked || 1;
    const user_id = req.user.id;

    if (!room_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'room_id, check_in, and check_out are required.', message: 'room_id, check_in, and check_out are required.' });
    }

    if (new Date(check_in) >= new Date(check_out)) {
      return res.status(400).json({ error: 'check_out must be after check_in.', message: 'check_out must be after check_in.' });
    }

    if (new Date(check_in) < new Date(new Date().toDateString())) {
      return res.status(400).json({ error: 'check_in cannot be in the past.', message: 'check_in cannot be in the past.' });
    }

    // Look up the room — if hotel_id not provided, get it from the room record
    let roomResult;
    if (hotel_id) {
      roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1 AND hotel_id = $2', [room_id, hotel_id]);
    } else {
      roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
    }

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found.', message: 'Room not found.' });
    }

    const room = roomResult.rows[0];
    hotel_id = room.hotel_id; // Ensure hotel_id is set from DB

    const rooms_booked = parseInt(guests) || 1;

    // Check availability (count both requested and confirmed bookings)
    const bookedResult = await pool.query(`
      SELECT COALESCE(SUM(COALESCE(rooms_booked, 1)), 0) AS count FROM bookings
      WHERE room_id = $1 AND status IN ('confirmed', 'requested')
        AND check_in < $3 AND check_out > $2
    `, [room_id, check_in, check_out]);

    const bookedCount = parseInt(bookedResult.rows[0].count);
    if (bookedCount + rooms_booked > room.total_rooms) {
      return res.status(409).json({ error: 'No rooms available for the selected dates.', message: 'No rooms available for the selected dates.' });
    }

    // Calculate total price
    const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / (1000 * 60 * 60 * 24));
    const price = parseFloat(room.price);
    const total_price = (nights * price * rooms_booked).toFixed(2);

    const result = await pool.query(`
      INSERT INTO bookings (user_id, room_id, hotel_id, check_in, check_out, guests, rooms_booked, total_price, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'requested')
      RETURNING *
    `, [user_id, room_id, hotel_id, check_in, check_out, rooms_booked, rooms_booked, total_price]);

    // Fetch hotel and room details for response
    const booking = result.rows[0];
    const hotelResult = await pool.query('SELECT name, location FROM hotels WHERE id = $1', [hotel_id]);
    const roomDetail = await pool.query('SELECT room_type, price FROM rooms WHERE id = $1', [room_id]);

    const roomPrice = parseFloat(roomDetail.rows[0].price);

    res.status(201).json({
      message: 'Booking requested!',
      id: booking.id,
      room_id: booking.room_id,
      hotel_id: booking.hotel_id,
      hotel_name: hotelResult.rows[0].name,
      hotel_location: hotelResult.rows[0].location,
      room_type: roomDetail.rows[0].room_type,
      check_in: booking.check_in,
      check_out: booking.check_out,
      rooms_booked: rooms_booked,
      price_per_night: roomPrice,
      total_price: booking.total_price,
      status: 'requested',
      nights,
      booking: {
        ...booking,
        hotel_name: hotelResult.rows[0].name,
        hotel_location: hotelResult.rows[0].location,
        room_type: roomDetail.rows[0].room_type,
        price_per_night: roomPrice,
        nights
      }
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

// GET /api/bookings — Get user's bookings
router.get('/', async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(`
      SELECT b.*, h.name AS hotel_name, h.location AS hotel_location, h.image_url AS hotel_image,
             r.room_type, r.price AS room_price,
             r.price AS price_per_night
      FROM bookings b
      JOIN hotels h ON h.id = b.hotel_id
      JOIN rooms r ON r.id = b.room_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [user_id]);

    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

// GET /api/bookings/my — Alias for GET / (my-bookings.html uses this)
router.get('/my', async (req, res) => {
  try {
    const user_id = req.user.id;

    const result = await pool.query(`
      SELECT b.*, h.name AS hotel_name, h.location AS hotel_location, h.image_url AS hotel_image,
             r.room_type, r.price AS room_price,
             r.price AS price_per_night
      FROM bookings b
      JOIN hotels h ON h.id = b.hotel_id
      JOIN rooms r ON r.id = b.room_id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [user_id]);

    res.json({ bookings: result.rows });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

// POST /api/bookings/:id/confirm — Confirm a requested booking
router.post('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      "UPDATE bookings SET status = 'confirmed' WHERE id = $1 AND user_id = $2 AND status = 'requested' RETURNING *",
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or not in requested status.', message: 'Booking not found or not in requested status.' });
    }

    res.json({ message: 'Booking confirmed.', booking: result.rows[0] });
  } catch (err) {
    console.error('Confirm booking error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

// POST /api/bookings/update/:id — Update a booking (used by my-bookings.html edit modal)
router.post('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const checkIn = req.body.checkIn || req.body.check_in;
    const checkOut = req.body.checkOut || req.body.check_out;
    const rooms_booked = req.body.rooms_booked || req.body.guests || 1;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Check-in and check-out dates are required.', message: 'Check-in and check-out dates are required.' });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      return res.status(400).json({ error: 'Check-out must be after check-in.', message: 'Check-out must be after check-in.' });
    }

    // Get the booking to recalculate price
    const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.', message: 'Booking not found.' });
    }

    const booking = bookingResult.rows[0];
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [booking.room_id]);
    const room = roomResult.rows[0];
    const price = parseFloat(room.price);
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const total_price = (nights * price * parseInt(rooms_booked)).toFixed(2);

    const result = await pool.query(
      'UPDATE bookings SET check_in = $1, check_out = $2, rooms_booked = $3, guests = $3, total_price = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
      [checkIn, checkOut, parseInt(rooms_booked), total_price, id, user_id]
    );

    res.json({ message: 'Booking updated.', booking: result.rows[0] });
  } catch (err) {
    console.error('Update booking error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

// POST /api/bookings/delete/:id — Delete/cancel a booking (used by my-bookings.html delete modal)
router.post('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found.', message: 'Booking not found.' });
    }

    res.json({ message: 'Booking deleted.', booking: result.rows[0] });
  } catch (err) {
    console.error('Delete booking error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

// POST /api/bookings/:id/cancel — Cancel a booking (set status to cancelled)
router.post('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const result = await pool.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2 AND status IN ('confirmed', 'requested') RETURNING *",
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found or already cancelled.', message: 'Booking not found or already cancelled.' });
    }

    res.json({ message: 'Booking cancelled.', booking: result.rows[0] });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

module.exports = router;
