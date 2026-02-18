const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings - create a booking
router.post('/', auth, async (req, res) => {
  try {
    // Parse body — handle cases where JSON middleware may not have parsed
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }

    // Merge query params as fallback (in case body isn't forwarded by proxy)
    const data = { ...req.query, ...body };

    // Accept both camelCase (frontend) and snake_case field names
    const room_id = data.roomId || data.room_id;
    const check_in = data.checkIn || data.check_in;
    const check_out = data.checkOut || data.check_out;
    const rooms_booked = Number(data.rooms_booked || data.roomsBooked) || 1;
    const user_id = req.user.id;

    if (!room_id || !check_in || !check_out) {
      return res.status(400).json({ message: 'Please provide room_id, check_in, and check_out' });
    }

    // Validate dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (checkInDate < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // Get room details (also resolves hotel_id from the room)
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const room = roomResult.rows[0];
    const hotel_id = room.hotel_id;

    // Check availability: count overlapping room bookings
    const overlapResult = await pool.query(
      `SELECT COALESCE(SUM(rooms_booked), 0) as booked FROM bookings
       WHERE room_id = $1 AND status = 'confirmed'
       AND check_in < $3 AND check_out > $2`,
      [room_id, check_in, check_out]
    );

    const booked = parseInt(overlapResult.rows[0].booked, 10);
    if (booked + rooms_booked > room.total_rooms) {
      const available = room.total_rooms - booked;
      return res.status(400).json({ message: available > 0 ? `Only ${available} room(s) available for the selected dates` : 'No rooms available for the selected dates' });
    }

    // Calculate total price (price per night × nights × rooms)
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const total_price = nights * parseFloat(room.price) * rooms_booked;

    // Create booking
    const result = await pool.query(
      `INSERT INTO bookings (user_id, room_id, hotel_id, check_in, check_out, guests, rooms_booked, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [user_id, room_id, hotel_id, check_in, check_out, rooms_booked, rooms_booked, total_price]
    );

    // Return booking with hotel and room info for the confirmation page
    const booking = result.rows[0];
    const hotelResult = await pool.query('SELECT name, location FROM hotels WHERE id = $1', [hotel_id]);
    const hotel = hotelResult.rows[0];

    res.status(201).json({
      id: booking.id,
      room_id: booking.room_id,
      hotel_id: booking.hotel_id,
      hotel_name: hotel ? hotel.name : '',
      hotel_location: hotel ? hotel.location : '',
      room_type: room.room_type,
      check_in: booking.check_in,
      check_out: booking.check_out,
      rooms_booked: booking.rooms_booked,
      price_per_night: parseFloat(room.price),
      total_price: booking.total_price,
      status: booking.status,
      created_at: booking.created_at
    });
  } catch (err) {
    console.error('Create booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/bookings/my - get user's bookings
router.get('/my', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.id, b.user_id, b.room_id, b.hotel_id, b.check_in, b.check_out,
              b.rooms_booked, b.total_price, b.status, b.created_at,
              h.name as hotel_name, h.location as hotel_location, h.image_url,
              r.room_type, r.price as price_per_night
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

// Shared update handler for PUT and POST
async function handleUpdateBooking(req, res) {
  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const data = { ...req.query, ...body };

    const bookingId = req.params.id;
    const user_id = req.user.id;

    // Fetch existing booking owned by this user
    const existing = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, user_id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = existing.rows[0];

    const check_in = data.checkIn || data.check_in || booking.check_in;
    const check_out = data.checkOut || data.check_out || booking.check_out;
    const rooms_booked = Number(data.rooms_booked || data.roomsBooked || data.guests) || booking.rooms_booked || 1;

    // Validate dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (checkInDate < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // Get room details
    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [booking.room_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const room = roomResult.rows[0];

    // Check availability (exclude current booking from overlap count)
    const overlapResult = await pool.query(
      `SELECT COALESCE(SUM(rooms_booked), 0) as booked FROM bookings
       WHERE room_id = $1 AND status = 'confirmed' AND id != $4
       AND check_in < $3 AND check_out > $2`,
      [booking.room_id, check_in, check_out, bookingId]
    );

    const booked = parseInt(overlapResult.rows[0].booked, 10);
    if (booked + rooms_booked > room.total_rooms) {
      const available = room.total_rooms - booked;
      return res.status(400).json({ message: available > 0 ? `Only ${available} room(s) available for the selected dates` : 'No rooms available for the selected dates' });
    }

    // Recalculate total price (price per night × nights × rooms)
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const total_price = nights * parseFloat(room.price) * rooms_booked;

    // Update booking
    const result = await pool.query(
      `UPDATE bookings SET check_in = $1, check_out = $2, guests = $3, rooms_booked = $4, total_price = $5
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [check_in, check_out, rooms_booked, rooms_booked, total_price, bookingId, user_id]
    );

    const updated = result.rows[0];
    const hotelResult = await pool.query('SELECT name, location FROM hotels WHERE id = $1', [updated.hotel_id]);
    const hotel = hotelResult.rows[0];

    res.json({
      id: updated.id,
      room_id: updated.room_id,
      hotel_id: updated.hotel_id,
      hotel_name: hotel ? hotel.name : '',
      hotel_location: hotel ? hotel.location : '',
      room_type: room.room_type,
      check_in: updated.check_in,
      check_out: updated.check_out,
      rooms_booked: updated.rooms_booked,
      price_per_night: parseFloat(room.price),
      total_price: updated.total_price,
      status: updated.status
    });
  } catch (err) {
    console.error('Update booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
}

// PUT /api/bookings/:id - update booking dates/guests
router.put('/:id', auth, handleUpdateBooking);

// PATCH /api/bookings/:id - alternative update method
router.patch('/:id', auth, handleUpdateBooking);

// POST /api/bookings/update/:id - fallback for proxies that don't forward PUT/PATCH
router.post('/update/:id', auth, handleUpdateBooking);

// DELETE /api/bookings/:id - delete a booking
router.delete('/:id', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const user_id = req.user.id;

    // Verify the booking exists and belongs to this user
    const existing = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, user_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Delete the booking
    await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, user_id]
    );

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/bookings/delete/:id - fallback for proxies that don't forward DELETE
router.post('/delete/:id', auth, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const user_id = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, user_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await pool.query(
      'DELETE FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, user_id]
    );

    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    console.error('Delete booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
