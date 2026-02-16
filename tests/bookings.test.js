const request = require('supertest');
const app = require('../server/index');
const { sequelize } = require('../server/config/database');
const { User, Hotel, Room } = require('../server/models');

let authToken;
let testRoom;

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Create user
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Booking Tester',
    email: 'booker@example.com',
    password: 'password123',
  });
  authToken = regRes.body.token;

  // Create hotel + room
  const hotel = await Hotel.create({
    name: 'Booking Test Hotel',
    location: 'Test City',
    rating: 4.0,
  });

  testRoom = await Room.create({
    hotelId: hotel.id,
    type: 'Standard',
    price: 100,
    capacity: 2,
    totalRooms: 5,
    available: true,
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Booking Endpoints', () => {
  describe('POST /api/bookings', () => {
    it('should create a booking', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const checkOut = new Date(futureDate);
      checkOut.setDate(checkOut.getDate() + 3);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: testRoom.id,
          checkIn: futureDate.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          guests: 2,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.booking).toHaveProperty('id');
      expect(res.body.booking.status).toBe('confirmed');
      expect(parseFloat(res.body.booking.totalPrice)).toBe(300);
    });

    it('should reject booking without auth', async () => {
      const res = await request(app).post('/api/bookings').send({
        roomId: testRoom.id,
        checkIn: '2025-12-01',
        checkOut: '2025-12-03',
        guests: 1,
      });
      expect(res.statusCode).toBe(401);
    });

    it('should reject booking for non-existent room', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: 9999,
          checkIn: '2025-12-01',
          checkOut: '2025-12-03',
          guests: 1,
        });
      expect(res.statusCode).toBe(404);
    });

    it('should reject when guests exceed capacity', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const checkOut = new Date(futureDate);
      checkOut.setDate(checkOut.getDate() + 2);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          roomId: testRoom.id,
          checkIn: futureDate.toISOString().split('T')[0],
          checkOut: checkOut.toISOString().split('T')[0],
          guests: 5,
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/capacity/i);
    });
  });

  describe('GET /api/bookings/my', () => {
    it('should return user bookings', async () => {
      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.bookings[0]).toHaveProperty('hotel');
      expect(res.body.bookings[0]).toHaveProperty('room');
    });

    it('should reject without auth', async () => {
      const res = await request(app).get('/api/bookings/my');
      expect(res.statusCode).toBe(401);
    });
  });
});
