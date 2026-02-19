const pool = require('./db');

async function seed() {
  try {
    console.log('Seeding database...');

    // Clear existing data
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM rooms');
    await pool.query('DELETE FROM hotels');

    // Insert hotels
    const hotels = [
      {
        name: 'The Grand Palace Hotel',
        location: 'New York, USA',
        description: 'A luxurious 5-star hotel in the heart of Manhattan with stunning skyline views, world-class dining, and premium amenities.',
        image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
        rating: 4.8
      },
      {
        name: 'Seaside Resort & Spa',
        location: 'Miami, USA',
        description: 'Beachfront resort featuring private beach access, infinity pool, full-service spa, and tropical gardens.',
        image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop',
        rating: 4.5
      },
      {
        name: 'Mountain View Lodge',
        location: 'Denver, USA',
        description: 'Cozy mountain retreat with breathtaking Rocky Mountain views, hiking trails, and a warm fireplace lounge.',
        image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
        rating: 4.3
      },
      {
        name: 'Urban Boutique Hotel',
        location: 'San Francisco, USA',
        description: 'Modern boutique hotel in downtown SF near Union Square, featuring contemporary design and artisan coffee bar.',
        image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=600&h=400&fit=crop',
        rating: 4.6
      },
      {
        name: 'Lakeside Inn',
        location: 'Chicago, USA',
        description: 'Charming lakeside hotel offering serene Lake Michigan views, bike rentals, and a rooftop restaurant.',
        image_url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=600&h=400&fit=crop',
        rating: 4.2
      },
      {
        name: 'Desert Oasis Resort',
        location: 'Las Vegas, USA',
        description: 'Premium resort with pool complex, casino access, live entertainment, and gourmet dining options.',
        image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&h=400&fit=crop',
        rating: 4.7
      },
      {
        name: 'Historic Downtown Hotel',
        location: 'Boston, USA',
        description: 'Elegantly restored historic building in the heart of Boston, walking distance to Freedom Trail and waterfront.',
        image_url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=600&h=400&fit=crop',
        rating: 4.4
      },
      {
        name: 'Tropical Paradise Hotel',
        location: 'Honolulu, USA',
        description: 'Hawaiian paradise with ocean-view rooms, luau experiences, snorkeling, and sunset cocktail bar.',
        image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop',
        rating: 4.9
      }
    ];

    const hotelIds = [];
    for (const h of hotels) {
      const result = await pool.query(
        'INSERT INTO hotels (name, location, description, image_url, rating) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [h.name, h.location, h.description, h.image_url, h.rating]
      );
      hotelIds.push(result.rows[0].id);
    }
    console.log(`Inserted ${hotelIds.length} hotels`);

    // Insert rooms for each hotel
    const roomTypes = [
      { room_type: 'Standard Room', price: 99, capacity: 2, total_rooms: 10, amenities: 'WiFi, TV, Air Conditioning, Mini Fridge' },
      { room_type: 'Deluxe Room', price: 179, capacity: 2, total_rooms: 8, amenities: 'WiFi, TV, Air Conditioning, Mini Bar, City View' },
      { room_type: 'Suite', price: 299, capacity: 4, total_rooms: 4, amenities: 'WiFi, TV, Air Conditioning, Mini Bar, Living Area, Premium View' },
      { room_type: 'Family Room', price: 219, capacity: 5, total_rooms: 5, amenities: 'WiFi, TV, Air Conditioning, Two Queen Beds, Kitchenette' },
    ];

    let roomCount = 0;
    for (let i = 0; i < hotelIds.length; i++) {
      const hotelId = hotelIds[i];
      // Price multiplier varies by hotel rating/prestige
      const multiplier = 0.8 + (i * 0.1);

      for (const rt of roomTypes) {
        const adjustedPrice = Math.round(rt.price * multiplier);
        await pool.query(
          'INSERT INTO rooms (hotel_id, room_type, price, capacity, total_rooms, available_rooms, amenities) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [hotelId, rt.room_type, adjustedPrice, rt.capacity, rt.total_rooms, rt.total_rooms, rt.amenities]
        );
        roomCount++;
      }
    }
    console.log(`Inserted ${roomCount} rooms`);

    console.log('Seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
