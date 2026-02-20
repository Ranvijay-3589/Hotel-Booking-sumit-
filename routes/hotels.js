const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/auth');
const router = express.Router();

// GET /api/hotels — Search hotels with optional filters
router.get('/', async (req, res) => {
  try {
    const { location, min_price, max_price, rating } = req.query;

    let query = `
      SELECT h.*,
        COALESCE(MIN(r.price), 0) AS min_room_price,
        COALESCE(MAX(r.price), 0) AS max_room_price,
        COUNT(r.id) AS total_rooms
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.id
    `;
    const conditions = [];
    const params = [];

    if (location) {
      params.push(`%${location}%`);
      conditions.push(`(LOWER(h.location) LIKE LOWER($${params.length}) OR LOWER(h.name) LIKE LOWER($${params.length}))`);
    }

    if (min_price) {
      params.push(parseFloat(min_price));
      conditions.push(`r.price >= $${params.length}`);
    }

    if (max_price) {
      params.push(parseFloat(max_price));
      conditions.push(`r.price <= $${params.length}`);
    }

    if (rating) {
      params.push(parseFloat(rating));
      conditions.push(`h.rating >= $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY h.id ORDER BY h.rating DESC, h.name ASC';

    const result = await pool.query(query, params);
    res.json({ hotels: result.rows });
  } catch (err) {
    console.error('Hotels search error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/hotels/:id — Hotel detail with rooms
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hotelResult = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (hotelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Hotel not found.' });
    }

    const roomsResult = await pool.query('SELECT * FROM rooms WHERE hotel_id = $1 ORDER BY price ASC', [id]);

    res.json({ hotel: hotelResult.rows[0], rooms: roomsResult.rows });
  } catch (err) {
    console.error('Hotel detail error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// GET /api/hotels/:id/availability — Check room availability for dates
router.get('/:id/availability', async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out } = req.query;

    if (!check_in || !check_out) {
      return res.status(400).json({ error: 'check_in and check_out dates are required.' });
    }

    // Get all rooms for the hotel with the count of overlapping bookings
    const result = await pool.query(`
      SELECT r.*,
        r.total_rooms - COALESCE(booked.count, 0) AS available_rooms
      FROM rooms r
      LEFT JOIN (
        SELECT room_id, COUNT(*) AS count
        FROM bookings
        WHERE hotel_id = $1
          AND status = 'confirmed'
          AND check_in < $3
          AND check_out > $2
        GROUP BY room_id
      ) booked ON booked.room_id = r.id
      WHERE r.hotel_id = $1
      ORDER BY r.price ASC
    `, [id, check_in, check_out]);

    res.json({ rooms: result.rows });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/hotels — Create a new hotel with rooms
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, location, description, rating, amenities, image_url, rooms } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Hotel name and location are required.', message: 'Hotel name and location are required.' });
    }

    await client.query('BEGIN');

    const hotelResult = await client.query(
      `INSERT INTO hotels (name, location, description, rating, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, location, description || '', parseFloat(rating) || 0, image_url || '']
    );
    const hotel = hotelResult.rows[0];

    const insertedRooms = [];
    if (Array.isArray(rooms) && rooms.length > 0) {
      for (const room of rooms) {
        const roomResult = await client.query(
          `INSERT INTO rooms (hotel_id, room_type, price, capacity, total_rooms, available_rooms)
           VALUES ($1, $2, $3, $4, $5, $5) RETURNING *`,
          [hotel.id, room.room_type, parseFloat(room.price_per_night) || 0, parseInt(room.capacity) || 2, 1]
        );
        insertedRooms.push(roomResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ hotel: { ...hotel, rooms: insertedRooms } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create hotel error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  } finally {
    client.release();
  }
});

// POST /api/hotels/update/:id — Update a hotel and its rooms
router.post('/update/:id', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, location, description, rating, amenities, image_url, rooms } = req.body;

    if (!name || !location) {
      return res.status(400).json({ error: 'Hotel name and location are required.', message: 'Hotel name and location are required.' });
    }

    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Hotel not found.', message: 'Hotel not found.' });
    }

    await client.query(
      `UPDATE hotels SET name = $1, location = $2, description = $3, rating = $4, image_url = $5 WHERE id = $6`,
      [name, location, description || '', parseFloat(rating) || 0, image_url || '', id]
    );

    if (Array.isArray(rooms)) {
      await client.query('DELETE FROM rooms WHERE hotel_id = $1', [id]);
      for (const room of rooms) {
        await client.query(
          `INSERT INTO rooms (hotel_id, room_type, price, capacity, total_rooms, available_rooms)
           VALUES ($1, $2, $3, $4, $5, $5)`,
          [id, room.room_type, parseFloat(room.price_per_night) || 0, parseInt(room.capacity) || 2, 1]
        );
      }
    }

    await client.query('COMMIT');

    const updatedHotel = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
    const updatedRooms = await pool.query('SELECT * FROM rooms WHERE hotel_id = $1 ORDER BY price ASC', [id]);

    res.json({ hotel: { ...updatedHotel.rows[0], rooms: updatedRooms.rows } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update hotel error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  } finally {
    client.release();
  }
});

// POST /api/hotels/delete/:id — Delete a hotel and its rooms/bookings
router.post('/delete/:id', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Hotel not found.', message: 'Hotel not found.' });
    }

    await client.query('DELETE FROM bookings WHERE hotel_id = $1', [id]);
    await client.query('DELETE FROM rooms WHERE hotel_id = $1', [id]);
    await client.query('DELETE FROM hotels WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Hotel deleted successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete hotel error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  } finally {
    client.release();
  }
});

module.exports = router;
