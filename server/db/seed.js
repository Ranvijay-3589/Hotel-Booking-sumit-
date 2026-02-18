require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');

const seed = async () => {
  const client = await pool.connect();
  try {
    // Clear existing data
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM rooms');
    await client.query('DELETE FROM hotels');

    // Insert hotels
    const hotelsResult = await client.query(`
      INSERT INTO hotels (name, location, description, image_url, rating) VALUES
      ('The Grand Palace', 'Mumbai', 'A luxurious 5-star hotel in the heart of Mumbai with stunning sea views and world-class amenities.', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', 4.8),
      ('Sunset Resort', 'Goa', 'Beautiful beachfront resort with private beach access, infinity pool, and tropical gardens.', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', 4.5),
      ('Mountain View Lodge', 'Manali', 'Cozy mountain lodge surrounded by pine forests with breathtaking Himalayan views.', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', 4.3),
      ('Royal Heritage Hotel', 'Jaipur', 'A heritage property converted into a luxury hotel, blending royal Rajasthani architecture with modern comforts.', 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800', 4.6),
      ('Lakeside Inn', 'Udaipur', 'Elegant lakeside hotel offering panoramic views of Lake Pichola and the Aravalli hills.', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', 4.7),
      ('City Central Hotel', 'Delhi', 'Modern business hotel located in central Delhi, perfect for business and leisure travelers.', 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800', 4.1),
      ('Backwater Retreat', 'Kerala', 'Serene retreat on the backwaters of Kerala with houseboat experiences and Ayurvedic spa.', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', 4.9),
      ('Alpine Heights', 'Shimla', 'Colonial-era hotel perched on a hilltop with panoramic views of the Shimla valley.', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800', 4.4)
      RETURNING id
    `);

    const hotelIds = hotelsResult.rows.map(r => r.id);

    // Insert rooms for each hotel
    const roomInserts = [];
    hotelIds.forEach(hotelId => {
      roomInserts.push(
        client.query(`
          INSERT INTO rooms (hotel_id, room_type, price, capacity, total_rooms, amenities) VALUES
          ($1, 'Standard', ${1500 + Math.floor(Math.random() * 1000)}, 2, 10, 'WiFi, TV, AC, Room Service'),
          ($1, 'Deluxe', ${3000 + Math.floor(Math.random() * 2000)}, 2, 6, 'WiFi, TV, AC, Mini Bar, Room Service, Balcony'),
          ($1, 'Suite', ${6000 + Math.floor(Math.random() * 4000)}, 4, 3, 'WiFi, TV, AC, Mini Bar, Room Service, Balcony, Living Area, Jacuzzi')
        `, [hotelId])
      );
    });
    await Promise.all(roomInserts);

    console.log('Seed completed successfully');
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

seed();
