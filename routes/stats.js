const express = require('express');
const pool = require('../db');
const router = express.Router();

// GET /api/stats — Get platform-wide statistics (public endpoint)
router.get('/', async (req, res) => {
  try {
    // Run all queries in parallel for performance
    const [
      hotelsCount,
      roomsCount,
      bookingsCount,
      usersCount,
      bookingsByStatus,
      revenueResult,
      topHotels,
      roomTypeDistribution,
      monthlyBookings
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM hotels'),
      pool.query('SELECT COUNT(*) AS count FROM rooms'),
      pool.query('SELECT COUNT(*) AS count FROM bookings'),
      pool.query('SELECT COUNT(*) AS count FROM users'),
      pool.query(`
        SELECT status, COUNT(*) AS count
        FROM bookings
        GROUP BY status
        ORDER BY count DESC
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status IN ('confirmed', 'requested') THEN total_price ELSE 0 END), 0) AS total_revenue,
          COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END), 0) AS confirmed_revenue,
          COALESCE(AVG(CASE WHEN status IN ('confirmed', 'requested') THEN total_price ELSE NULL END), 0) AS avg_booking_value,
          COALESCE(SUM(CASE WHEN status IN ('confirmed', 'requested') THEN rooms_booked ELSE 0 END), 0) AS total_rooms_booked
        FROM bookings
      `),
      pool.query(`
        SELECT h.name, COUNT(b.id) AS booking_count,
               COALESCE(SUM(b.total_price), 0) AS total_revenue
        FROM hotels h
        LEFT JOIN bookings b ON b.hotel_id = h.id AND b.status IN ('confirmed', 'requested')
        GROUP BY h.id, h.name
        ORDER BY booking_count DESC
        LIMIT 10
      `),
      pool.query(`
        SELECT r.room_type, COUNT(b.id) AS booking_count
        FROM rooms r
        LEFT JOIN bookings b ON b.room_id = r.id AND b.status IN ('confirmed', 'requested')
        GROUP BY r.room_type
        ORDER BY booking_count DESC
      `),
      pool.query(`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM') AS month,
          COUNT(*) AS count,
          COALESCE(SUM(total_price), 0) AS revenue
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `)
    ]);

    res.json({
      overview: {
        total_hotels: parseInt(hotelsCount.rows[0].count),
        total_rooms: parseInt(roomsCount.rows[0].count),
        total_bookings: parseInt(bookingsCount.rows[0].count),
        total_users: parseInt(usersCount.rows[0].count),
        total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
        confirmed_revenue: parseFloat(revenueResult.rows[0].confirmed_revenue),
        avg_booking_value: parseFloat(parseFloat(revenueResult.rows[0].avg_booking_value).toFixed(2)),
        total_rooms_booked: parseInt(revenueResult.rows[0].total_rooms_booked)
      },
      bookings_by_status: bookingsByStatus.rows.map(r => ({
        status: r.status,
        count: parseInt(r.count)
      })),
      top_hotels: topHotels.rows.map(r => ({
        name: r.name,
        booking_count: parseInt(r.booking_count),
        total_revenue: parseFloat(r.total_revenue)
      })),
      room_type_distribution: roomTypeDistribution.rows.map(r => ({
        room_type: r.room_type,
        booking_count: parseInt(r.booking_count)
      })),
      monthly_bookings: monthlyBookings.rows.map(r => ({
        month: r.month,
        count: parseInt(r.count),
        revenue: parseFloat(r.revenue)
      }))
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error.', message: 'Server error.' });
  }
});

module.exports = router;
