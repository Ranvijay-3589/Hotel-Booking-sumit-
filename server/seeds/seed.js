const { sequelize } = require('../config/database');
const { User, Hotel, Room } = require('../models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('Database synced (tables recreated).');

    // Create demo user
    await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password123',
    });
    console.log('Demo user created (demo@example.com / password123)');

    // Create hotels
    const hotels = await Hotel.bulkCreate([
      {
        name: 'Grand Palace Hotel',
        description: 'A luxurious 5-star hotel in the heart of New York City with stunning skyline views and world-class amenities.',
        location: 'New York',
        address: '123 Fifth Avenue, New York, NY 10001',
        rating: 4.8,
        amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Concierge'],
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      },
      {
        name: 'Seaside Resort & Spa',
        description: 'Beachfront resort offering relaxation and adventure with pristine sandy beaches and crystal-clear waters.',
        location: 'Miami',
        address: '456 Ocean Drive, Miami Beach, FL 33139',
        rating: 4.5,
        amenities: ['WiFi', 'Pool', 'Beach Access', 'Spa', 'Restaurant', 'Water Sports'],
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      },
      {
        name: 'Mountain View Lodge',
        description: 'Cozy mountain retreat perfect for nature lovers with hiking trails and scenic mountain views.',
        location: 'Denver',
        address: '789 Mountain Road, Denver, CO 80201',
        rating: 4.3,
        amenities: ['WiFi', 'Fireplace', 'Hiking', 'Restaurant', 'Parking'],
        image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      },
      {
        name: 'The Urban Boutique',
        description: 'Stylish boutique hotel in downtown San Francisco, steps away from major attractions and dining.',
        location: 'San Francisco',
        address: '321 Market Street, San Francisco, CA 94105',
        rating: 4.6,
        amenities: ['WiFi', 'Gym', 'Restaurant', 'Rooftop Bar', 'Business Center'],
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      },
      {
        name: 'Lakeside Inn',
        description: 'Charming lakeside inn offering peaceful stays with beautiful lake views and outdoor activities.',
        location: 'Chicago',
        address: '555 Lakeshore Drive, Chicago, IL 60601',
        rating: 4.1,
        amenities: ['WiFi', 'Lake View', 'Restaurant', 'Kayaking', 'Parking'],
        image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      },
      {
        name: 'Desert Oasis Resort',
        description: 'Luxury desert resort with stunning sunset views, golf course, and rejuvenating spa treatments.',
        location: 'Las Vegas',
        address: '777 Desert Boulevard, Las Vegas, NV 89101',
        rating: 4.7,
        amenities: ['WiFi', 'Pool', 'Spa', 'Golf', 'Casino', 'Restaurant', 'Bar'],
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      },
    ]);

    // Create rooms for each hotel
    const roomTypes = [
      { type: 'Standard', description: 'Comfortable room with essential amenities', priceBase: 99, capacity: 2, totalRooms: 10 },
      { type: 'Deluxe', description: 'Spacious room with premium furnishings and city view', priceBase: 179, capacity: 2, totalRooms: 8 },
      { type: 'Suite', description: 'Luxury suite with separate living area and panoramic views', priceBase: 299, capacity: 4, totalRooms: 4 },
      { type: 'Family', description: 'Large room designed for families with extra beds', priceBase: 219, capacity: 6, totalRooms: 5 },
    ];

    for (const hotel of hotels) {
      const multiplier = 0.8 + (parseFloat(hotel.rating) / 5) * 0.6;
      for (const roomType of roomTypes) {
        await Room.create({
          hotelId: hotel.id,
          type: roomType.type,
          description: roomType.description,
          price: (roomType.priceBase * multiplier).toFixed(2),
          capacity: roomType.capacity,
          totalRooms: roomType.totalRooms,
          available: true,
        });
      }
    }

    console.log(`${hotels.length} hotels created with rooms.`);
    console.log('Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
