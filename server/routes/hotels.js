const express = require('express');
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/hotels - search with filters
router.get('/', async (req, res) => {
  try {
    const { location, min_price, max_price, search } = req.query;

    let query = `
      SELECT h.*,
        COALESCE(MIN(r.price), 0) AS min_room_price,
        COALESCE(MAX(r.price), 0) AS max_room_price,
        COALESCE(SUM(r.available_rooms), 0) AS total_available
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.id
    `;

    const conditions = [];
    const params = [];

    if (location) {
      params.push(`%${location}%`);
      conditions.push(`LOWER(h.location) LIKE LOWER($${params.length})`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(LOWER(h.name) LIKE LOWER($${params.length}) OR LOWER(h.location) LIKE LOWER($${params.length}) OR LOWER(h.description) LIKE LOWER($${params.length}))`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY h.id';

    if (min_price) {
      params.push(parseFloat(min_price));
      query += ` HAVING COALESCE(MIN(r.price), 0) >= $${params.length}`;
    }

    if (max_price) {
      if (min_price) {
        params.push(parseFloat(max_price));
        query += ` AND COALESCE(MIN(r.price), 0) <= $${params.length}`;
      } else {
        params.push(parseFloat(max_price));
        query += ` HAVING COALESCE(MIN(r.price), 0) <= $${params.length}`;
      }
    }

    query += ' ORDER BY h.rating DESC';

    const result = await pool.query(query, params);
    res.json({ hotels: result.rows });
  } catch (err) {
    console.error('Get hotels error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/hotels/:id - hotel detail with rooms
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hotelResult = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (hotelResult.rows.length === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const roomsResult = await pool.query(
      'SELECT * FROM rooms WHERE hotel_id = $1 ORDER BY price ASC',
      [id]
    );

    res.json({
      hotel: hotelResult.rows[0],
      rooms: roomsResult.rows,
    });
  } catch (err) {
    console.error('Get hotel error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/hotels - create hotel with rooms
router.post('/', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, location, description, rating, amenities, image_url, rooms } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Hotel name and location are required' });
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
    console.error('Create hotel error:', err.message);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/hotels/update/:id - update hotel
router.post('/update/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { name, location, description, rating, amenities, image_url, rooms } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: 'Hotel name and location are required' });
    }

    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Hotel not found' });
    }

    await client.query(
      `UPDATE hotels SET name = $1, location = $2, description = $3, rating = $4, image_url = $5
       WHERE id = $6`,
      [name, location, description || '', parseFloat(rating) || 0, image_url || '', id]
    );

    // Replace rooms: delete old ones and insert new ones
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
    console.error('Update hotel error:', err.message);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/hotels/delete/:id - delete hotel and its rooms
router.post('/delete/:id', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const existing = await client.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Delete bookings for this hotel's rooms first
    await client.query('DELETE FROM bookings WHERE hotel_id = $1', [id]);
    await client.query('DELETE FROM rooms WHERE hotel_id = $1', [id]);
    await client.query('DELETE FROM hotels WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Hotel deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete hotel error:', err.message);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
