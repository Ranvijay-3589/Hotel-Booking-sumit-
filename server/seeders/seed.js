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
      },
      {
        name: 'Taj Beachside Goa',
        location: 'Goa',
        description: 'A stunning beachside resort in South Goa with private beach, infinity pool, and Ayurvedic spa.',
        rating: 4.7,
        amenities: JSON.stringify(['WiFi', 'Private Beach', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Water Sports']),
        image_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9'
      },
      {
        name: 'The Oberoi Udaipur',
        location: 'Udaipur',
        description: 'Luxury lakeside hotel overlooking Lake Pichola with traditional Rajasthani architecture and royal hospitality.',
        rating: 4.9,
        amenities: JSON.stringify(['WiFi', 'Lake View', 'Pool', 'Spa', 'Fine Dining', 'Boat Rides', 'Concierge']),
        image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb'
      },
      {
        name: 'Himalayan Heights Resort',
        location: 'Manali',
        description: 'A serene mountain resort in the heart of Manali with breathtaking Himalayan views and adventure activities.',
        rating: 4.4,
        amenities: JSON.stringify(['WiFi', 'Mountain View', 'Fireplace', 'Restaurant', 'Trekking', 'Parking']),
        image_url: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b'
      },
      {
        name: 'Marina Bay Hotel',
        location: 'Mumbai',
        description: 'Premium waterfront hotel in South Mumbai with panoramic views of the Arabian Sea and Gateway of India.',
        rating: 4.6,
        amenities: JSON.stringify(['WiFi', 'Sea View', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Business Center']),
        image_url: 'https://images.unsplash.com/photo-1529290130-4ca3753253ae'
      },
      {
        name: 'Kerala Backwaters Resort',
        location: 'Alleppey',
        description: 'Tranquil lakeside resort offering houseboat experiences and traditional Kerala cuisine amidst lush greenery.',
        rating: 4.5,
        amenities: JSON.stringify(['WiFi', 'Houseboat', 'Ayurvedic Spa', 'Restaurant', 'Fishing', 'Yoga']),
        image_url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7'
      },
      {
        name: 'Heritage Haveli Jaipur',
        location: 'Jaipur',
        description: 'A beautifully restored heritage haveli in the Pink City with rooftop dining and views of Hawa Mahal.',
        rating: 4.3,
        amenities: JSON.stringify(['WiFi', 'Heritage Architecture', 'Rooftop Restaurant', 'Cultural Tours', 'Parking']),
        image_url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c'
      },
      {
        name: 'ITC Grand Delhi',
        location: 'New Delhi',
        description: 'Award-winning luxury hotel in the diplomatic enclave with Mughal-inspired gardens and world-class dining.',
        rating: 4.8,
        amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Fine Dining', 'Gym', 'Business Center', 'Concierge']),
        image_url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32'
      },
      {
        name: 'Coorg Coffee Estate Stay',
        location: 'Coorg',
        description: 'A unique plantation stay surrounded by coffee estates in the Scotland of India with misty mountain views.',
        rating: 4.2,
        amenities: JSON.stringify(['WiFi', 'Plantation Tours', 'Restaurant', 'Nature Walks', 'Bird Watching', 'Parking']),
        image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6'
      },
      {
        name: 'Lakeview Retreat Shimla',
        location: 'Shimla',
        description: 'Colonial-style hill station hotel on Mall Road with panoramic views of the Himalayas and cozy fireside lounges.',
        rating: 4.1,
        amenities: JSON.stringify(['WiFi', 'Mountain View', 'Fireplace', 'Restaurant', 'Library', 'Parking']),
        image_url: 'https://images.unsplash.com/photo-1580977276076-ae4b8c219b8e'
      },
      {
        name: 'Andaman Beach Paradise',
        location: 'Port Blair',
        description: 'Tropical island resort with crystal-clear waters, coral reef snorkeling, and pristine white sand beaches.',
        rating: 4.6,
        amenities: JSON.stringify(['WiFi', 'Beach Access', 'Snorkeling', 'Pool', 'Restaurant', 'Scuba Diving']),
        image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'
      }
    ]);
    console.log(`${hotels.length} hotels created.`);

    // Create rooms for each hotel with varied pricing
    const roomsData = [];
    const pricingTiers = {
      // US hotels
      1: { standard: 99.99, deluxe: 179.99, suite: 299.99, family: 219.99 },
      2: { standard: 129.99, deluxe: 199.99, suite: 349.99, family: 249.99 },
      3: { standard: 89.99, deluxe: 159.99, suite: 269.99, family: 189.99 },
      4: { standard: 79.99, deluxe: 149.99, suite: 249.99, family: 179.99 },
      5: { standard: 149.99, deluxe: 249.99, suite: 449.99, family: 299.99 },
      // Indian hotels (INR-like pricing scaled)
      6: { standard: 3500, deluxe: 5500, suite: 9500, family: 7000 },
      7: { standard: 8000, deluxe: 12000, suite: 22000, family: 15000 },
      8: { standard: 2500, deluxe: 4000, suite: 7500, family: 5500 },
      9: { standard: 5000, deluxe: 8000, suite: 15000, family: 10000 },
      10: { standard: 3000, deluxe: 5000, suite: 8500, family: 6000 },
      11: { standard: 2800, deluxe: 4500, suite: 8000, family: 5800 },
      12: { standard: 6000, deluxe: 9500, suite: 18000, family: 12000 },
      13: { standard: 2200, deluxe: 3800, suite: 6500, family: 4800 },
      14: { standard: 2000, deluxe: 3500, suite: 6000, family: 4500 },
      15: { standard: 4000, deluxe: 6500, suite: 11000, family: 8000 }
    };

    hotels.forEach(hotel => {
      const pricing = pricingTiers[hotel.id] || { standard: 99.99, deluxe: 179.99, suite: 299.99, family: 219.99 };
      roomsData.push(
        {
          hotel_id: hotel.id,
          room_type: 'Standard',
          price_per_night: pricing.standard,
          capacity: 2,
          available: true,
          description: 'Comfortable standard room with all basic amenities.'
        },
        {
          hotel_id: hotel.id,
          room_type: 'Deluxe',
          price_per_night: pricing.deluxe,
          capacity: 2,
          available: true,
          description: 'Spacious deluxe room with premium furnishings and city views.'
        },
        {
          hotel_id: hotel.id,
          room_type: 'Suite',
          price_per_night: pricing.suite,
          capacity: 4,
          available: true,
          description: 'Luxurious suite with separate living area and panoramic views.'
        },
        {
          hotel_id: hotel.id,
          room_type: 'Family Room',
          price_per_night: pricing.family,
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
