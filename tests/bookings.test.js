const request = require('supertest');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const { app } = require('../server/index');
const { sequelize, User, Hotel, Room } = require('../server/models');

let authToken;
let testRoom;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Create test user
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Booking Tester', email: 'booktest@example.com', password: 'password123' });

  authToken = registerRes.body.token;

  // Create test hotel and room
  const hotel = await Hotel.create({
    name: 'Booking Test Hotel',
    location: 'Chicago',
    description: 'Hotel for booking tests',
    rating: 4.0
  });

  testRoom = await Room.create({
    hotel_id: hotel.id,
    room_type: 'Standard',
    price_per_night: 100,
    capacity: 2,
    available: true,
    description: 'Test room'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Bookings API', () => {
  describe('POST /api/bookings', () => {
    it('should create a booking', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 3);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          room_id: testRoom.id,
          check_in: tomorrow.toISOString().split('T')[0],
          check_out: dayAfter.toISOString().split('T')[0]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('booking');
      expect(res.body.booking.status).toBe('confirmed');
      expect(parseFloat(res.body.booking.total_price)).toBe(200);
    });

    it('should reject booking without auth', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          room_id: testRoom.id,
          check_in: '2026-06-01',
          check_out: '2026-06-03'
        });

      expect(res.statusCode).toBe(401);
    });

    it('should reject overlapping bookings', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          room_id: testRoom.id,
          check_in: tomorrow.toISOString().split('T')[0],
          check_out: dayAfter.toISOString().split('T')[0]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already booked/i);
    });

    it('should reject invalid dates', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          room_id: testRoom.id,
          check_in: '2020-01-01',
          check_out: '2020-01-03'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject when check-out is before check-in', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          room_id: testRoom.id,
          check_in: '2026-12-10',
          check_out: '2026-12-08'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject non-existent room', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          room_id: 99999,
          check_in: '2026-12-01',
          check_out: '2026-12-05'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/bookings/my', () => {
    it('should return user bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('bookings');
      expect(res.body.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.bookings[0]).toHaveProperty('room');
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .get('/api/bookings/my');

      expect(res.statusCode).toBe(401);
    });
  });
});
