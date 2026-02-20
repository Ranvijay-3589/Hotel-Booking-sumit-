const pool = require('./pool');

async function seed() {
  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM rooms');
    await client.query('DELETE FROM hotels');

    // Insert hotels
    const hotelsResult = await client.query(`
      INSERT INTO hotels (name, location, description, image_url, rating) VALUES
        ('Grand Palace Hotel', 'Mumbai', 'Luxury 5-star hotel in the heart of Mumbai with stunning sea views and world-class amenities.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 4.8),
        ('Mountain View Resort', 'Manali', 'A serene mountain retreat surrounded by pine forests and snow-capped peaks.', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 4.5),
        ('Seaside Inn', 'Goa', 'Charming beachfront property with direct access to pristine sandy beaches.', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 4.3),
        ('Royal Heritage Hotel', 'Jaipur', 'A restored heritage palace offering a royal Rajasthani experience.', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 4.7),
        ('Lakeside Retreat', 'Udaipur', 'Elegant lakeside property with panoramic views of Lake Pichola.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 4.6),
        ('Tech Park Suites', 'Bangalore', 'Modern business hotel near major IT parks with excellent connectivity.', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', 4.2),
        ('Backwater Paradise', 'Kerala', 'Traditional houseboat-style rooms on the serene Kerala backwaters.', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 4.9),
        ('Snow Peak Lodge', 'Shimla', 'Cozy lodge with breathtaking Himalayan views and warm hospitality.', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800', 4.4)
      RETURNING id
    `);

    const hotelIds = hotelsResult.rows.map(r => r.id);

    // Insert rooms for each hotel
    const roomTypes = [
      { type: 'Standard Room', priceBase: 2500, capacity: 2, total: 10 },
      { type: 'Deluxe Room', priceBase: 4500, capacity: 2, total: 8 },
      { type: 'Suite', priceBase: 8000, capacity: 4, total: 4 },
      { type: 'Family Room', priceBase: 6000, capacity: 6, total: 5 },
    ];

    for (let i = 0; i < hotelIds.length; i++) {
      const hotelId = hotelIds[i];
      const multiplier = 1 + (i * 0.15);

      for (const rt of roomTypes) {
        const price = Math.round(rt.priceBase * multiplier);
        const available = rt.total;
        const amenities = rt.type === 'Suite'
          ? 'WiFi, AC, TV, Mini Bar, Jacuzzi, Living Area'
          : rt.type === 'Deluxe Room'
            ? 'WiFi, AC, TV, Mini Bar'
            : rt.type === 'Family Room'
              ? 'WiFi, AC, TV, Extra Beds, Play Area'
              : 'WiFi, AC, TV';

        await client.query(
          `INSERT INTO rooms (hotel_id, room_type, price, capacity, total_rooms, available_rooms, amenities)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [hotelId, rt.type, price, rt.capacity, rt.total, available, amenities]
        );
      }
    }

    console.log('Database seeded successfully');
  } catch (err) {
    console.error('Error seeding database:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
