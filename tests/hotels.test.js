const request = require('supertest');
const app = require('../server/index');
const { sequelize } = require('../server/config/database');
const { Hotel, Room } = require('../server/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });

  const hotel = await Hotel.create({
    name: 'Test Hotel',
    description: 'A great test hotel',
    location: 'New York',
    address: '123 Test St',
    rating: 4.5,
    amenities: ['WiFi', 'Pool'],
    image: 'https://example.com/hotel.jpg',
  });

  await Room.bulkCreate([
    { hotelId: hotel.id, type: 'Standard', price: 100, capacity: 2, totalRooms: 5, available: true },
    { hotelId: hotel.id, type: 'Deluxe', price: 200, capacity: 3, totalRooms: 3, available: true },
    { hotelId: hotel.id, type: 'Suite', price: 350, capacity: 4, totalRooms: 2, available: false },
  ]);

  await Hotel.create({
    name: 'Beach Resort',
    description: 'Beachside paradise',
    location: 'Miami',
    rating: 4.2,
    amenities: ['WiFi', 'Beach'],
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Hotel Endpoints', () => {
  describe('GET /api/hotels', () => {
    it('should return all hotels', async () => {
      const res = await request(app).get('/api/hotels');
      expect(res.statusCode).toBe(200);
      expect(res.body.hotels.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by location', async () => {
      const res = await request(app).get('/api/hotels?location=New York');
      expect(res.statusCode).toBe(200);
      expect(res.body.hotels.length).toBe(1);
      expect(res.body.hotels[0].location).toBe('New York');
    });

    it('should filter by search term', async () => {
      const res = await request(app).get('/api/hotels?search=Beach');
      expect(res.statusCode).toBe(200);
      expect(res.body.hotels.length).toBe(1);
    });

    it('should filter by price range', async () => {
      const res = await request(app).get('/api/hotels?minPrice=150&maxPrice=250');
      expect(res.statusCode).toBe(200);
      res.body.hotels.forEach((hotel) => {
        hotel.rooms.forEach((room) => {
          expect(parseFloat(room.price)).toBeGreaterThanOrEqual(150);
          expect(parseFloat(room.price)).toBeLessThanOrEqual(250);
        });
      });
    });
  });

  describe('GET /api/hotels/:id', () => {
    it('should return hotel with rooms', async () => {
      const res = await request(app).get('/api/hotels/1');
      expect(res.statusCode).toBe(200);
      expect(res.body.hotel).toHaveProperty('name', 'Test Hotel');
      expect(res.body.hotel.rooms.length).toBe(3);
    });

    it('should return 404 for non-existent hotel', async () => {
      const res = await request(app).get('/api/hotels/9999');
      expect(res.statusCode).toBe(404);
    });
  });
});
