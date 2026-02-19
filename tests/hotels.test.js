const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const { app } = require('../server/index');
const { sequelize, Hotel, Room } = require('../server/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Seed test data
  const hotel = await Hotel.create({
    name: 'Test Hotel',
    location: 'New York',
    description: 'A test hotel for unit testing',
    rating: 4.5,
    amenities: JSON.stringify(['WiFi', 'Pool'])
  });

  await Room.bulkCreate([
    {
      hotel_id: hotel.id,
      room_type: 'Standard',
      price_per_night: 100,
      capacity: 2,
      available: true,
      description: 'Standard room'
    },
    {
      hotel_id: hotel.id,
      room_type: 'Deluxe',
      price_per_night: 200,
      capacity: 3,
      available: true,
      description: 'Deluxe room'
    }
  ]);

  await Hotel.create({
    name: 'Miami Beach Resort',
    location: 'Miami',
    description: 'A resort in Miami',
    rating: 4.0
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Hotels API', () => {
  describe('GET /api/hotels', () => {
    it('should return all hotels', async () => {
      const res = await request(app).get('/api/hotels');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('hotels');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.hotels.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by location', async () => {
      const res = await request(app).get('/api/hotels?location=New York');

      expect(res.statusCode).toBe(200);
      res.body.hotels.forEach(hotel => {
        expect(hotel.location.toLowerCase()).toContain('new york');
      });
    });

    it('should filter by price range', async () => {
      const res = await request(app).get('/api/hotels?min_price=50&max_price=150');

      expect(res.statusCode).toBe(200);
      expect(res.body.hotels.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty for non-existent location', async () => {
      const res = await request(app).get('/api/hotels?location=Atlantis');

      expect(res.statusCode).toBe(200);
      expect(res.body.hotels.length).toBe(0);
    });

    it('should support pagination', async () => {
      const res = await request(app).get('/api/hotels?page=1&limit=1');

      expect(res.statusCode).toBe(200);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/hotels/:id', () => {
    it('should return hotel details with rooms', async () => {
      const hotel = await Hotel.findOne({ where: { name: 'Test Hotel' } });
      const res = await request(app).get(`/api/hotels/${hotel.id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.hotel.name).toBe('Test Hotel');
      expect(res.body.hotel.rooms).toBeDefined();
      expect(res.body.hotel.rooms.length).toBe(2);
    });

    it('should return 404 for non-existent hotel', async () => {
      const res = await request(app).get('/api/hotels/99999');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });
});
