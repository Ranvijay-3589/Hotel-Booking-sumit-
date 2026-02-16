const express = require('express');
const { getDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function datesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

router.post('/', requireAuth, async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, roomsBooked = 1 } = req.body;
    if (!roomId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'roomId, checkIn, and checkOut are required' });
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({ message: 'checkOut must be after checkIn' });
    }

    const db = await getDb();
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', Number(roomId));
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const existingBookings = await db.all(
      'SELECT * FROM bookings WHERE room_id = ?',
      Number(roomId)
    );

    let alreadyBooked = 0;
    for (const booking of existingBookings) {
      if (datesOverlap(checkIn, checkOut, booking.check_in, booking.check_out)) {
        alreadyBooked += booking.rooms_booked;
      }
    }

    const available = room.total_rooms - alreadyBooked;
    if (Number(roomsBooked) > available) {
      return res.status(409).json({ message: 'Not enough rooms available for selected dates' });
    }

    const result = await db.run(
      `INSERT INTO bookings (user_id, room_id, check_in, check_out, rooms_booked)
       VALUES (?, ?, ?, ?, ?)`,
      req.user.id,
      Number(roomId),
      checkIn,
      checkOut,
      Number(roomsBooked)
    );

    return res.status(201).json({
      id: result.lastID,
      userId: req.user.id,
      roomId: Number(roomId),
      checkIn,
      checkOut,
      roomsBooked: Number(roomsBooked)
    });
  } catch (error) {
    return res.status(500).json({ message: 'Booking failed' });
  }
});

router.get('/my', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const bookings = await db.all(
      `
      SELECT
        b.id,
        b.check_in,
        b.check_out,
        b.rooms_booked,
        b.created_at,
        h.name AS hotel_name,
        h.location AS hotel_location,
        r.room_type,
        r.price_per_night
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN hotels h ON h.id = r.hotel_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
      `,
      req.user.id
    );

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch bookings' });
  }
});

module.exports = router;
