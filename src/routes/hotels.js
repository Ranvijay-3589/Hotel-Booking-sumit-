const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { location = '', minPrice, maxPrice } = req.query;
    const db = await getDb();

    const params = [];
    let where = 'WHERE 1=1';

    if (location) {
      where += ' AND LOWER(h.location) LIKE ?';
      params.push(`%${location.toLowerCase()}%`);
    }

    if (minPrice) {
      where += ' AND r.price_per_night >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      where += ' AND r.price_per_night <= ?';
      params.push(Number(maxPrice));
    }

    const hotels = await db.all(
      `
      SELECT
        h.id,
        h.name,
        h.location,
        h.description,
        MIN(r.price_per_night) AS min_price,
        MAX(r.price_per_night) AS max_price
      FROM hotels h
      JOIN rooms r ON r.hotel_id = h.id
      ${where}
      GROUP BY h.id, h.name, h.location, h.description
      ORDER BY h.name ASC
      `,
      ...params
    );

    return res.json(hotels);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch hotels' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const hotelId = Number(req.params.id);
    const db = await getDb();

    const hotel = await db.get('SELECT * FROM hotels WHERE id = ?', hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const rooms = await db.all(
      `
      SELECT
        r.id,
        r.room_type,
        r.price_per_night,
        r.total_rooms,
        r.total_rooms - COALESCE(SUM(b.rooms_booked), 0) AS currently_available
      FROM rooms r
      LEFT JOIN bookings b ON b.room_id = r.id
      WHERE r.hotel_id = ?
      GROUP BY r.id, r.room_type, r.price_per_night, r.total_rooms
      ORDER BY r.price_per_night ASC
      `,
      hotelId
    );

    return res.json({ ...hotel, rooms });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch hotel details' });
  }
});

module.exports = router;
