const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sequelize, User, Hotel, Room } = require('../models');

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    await sequelize.sync({ force: true });
    console.log('Tables created.');

    // Create test user
    const user = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    });
    console.log('Test user created:', user.email);

    // Create hotels
    const hotels = await Hotel.bulkCreate([
      {
        name: 'Grand Palace Hotel',
        location: 'New York',
        description: 'A luxurious 5-star hotel in the heart of Manhattan with stunning views of Central Park.',
        rating: 4.8,
        amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking']),
        image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
      },
      {
        name: 'Seaside Resort',
        location: 'Miami',
        description: 'Beautiful beachfront resort with tropical gardens and ocean views.',
        rating: 4.5,
        amenities: JSON.stringify(['WiFi', 'Beach Access', 'Pool', 'Restaurant', 'Bar']),
        image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4'
      },
      {
        name: 'Mountain Lodge',
        location: 'Denver',
        description: 'Cozy mountain retreat perfect for nature lovers and adventure seekers.',
        rating: 4.3,
        amenities: JSON.stringify(['WiFi', 'Fireplace', 'Hiking Trails', 'Restaurant']),
        image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa'
      },
      {
        name: 'City Center Inn',
        location: 'Chicago',
        description: 'Modern hotel in downtown Chicago, close to major attractions and business districts.',
        rating: 4.1,
        amenities: JSON.stringify(['WiFi', 'Gym', 'Restaurant', 'Business Center']),
        image_url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791'
      },
      {
        name: 'The Royal Suite',
        location: 'Los Angeles',
        description: 'Elegant boutique hotel in Beverly Hills with world-class amenities.',
        rating: 4.9,
        amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Valet Parking', 'Concierge']),
        image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
      }
    ]);
    console.log(`${hotels.length} hotels created.`);

    // Create rooms for each hotel
    const roomsData = [];
    hotels.forEach(hotel => {
      roomsData.push(
        {
          hotel_id: hotel.id,
          room_type: 'Standard',
          price_per_night: 99.99,
          capacity: 2,
          available: true,
          description: 'Comfortable standard room with all basic amenities.'
        },
        {
          hotel_id: hotel.id,
          room_type: 'Deluxe',
          price_per_night: 179.99,
          capacity: 2,
          available: true,
          description: 'Spacious deluxe room with premium furnishings and city views.'
        },
        {
          hotel_id: hotel.id,
          room_type: 'Suite',
          price_per_night: 299.99,
          capacity: 4,
          available: true,
          description: 'Luxurious suite with separate living area and panoramic views.'
        },
        {
          hotel_id: hotel.id,
          room_type: 'Family Room',
          price_per_night: 219.99,
          capacity: 4,
          available: true,
          description: 'Large family-friendly room with extra beds and entertainment.'
        }
      );
    });

    const rooms = await Room.bulkCreate(roomsData);
    console.log(`${rooms.length} rooms created.`);

    console.log('\nSeed completed successfully!');
    console.log('Test login: john@example.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedData();
