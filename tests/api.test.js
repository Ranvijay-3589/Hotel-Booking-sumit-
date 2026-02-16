const fs = require('fs');
const path = require('path');
const request = require('supertest');

process.env.DB_FILE = path.join(__dirname, 'test.sqlite');
process.env.JWT_SECRET = 'test-secret';

const { initDb } = require('../src/db');
const { createApp } = require('../src/app');

describe('Hotel Booking MVP API', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    if (fs.existsSync(process.env.DB_FILE)) {
      fs.rmSync(process.env.DB_FILE);
    }

    await initDb();
    app = createApp();
  });

  test('register and login user', async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.email).toBe('test@example.com');

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.token).toBeDefined();
    authToken = loginResponse.body.token;
  });

  test('fetch hotels with filters', async () => {
    const hotelsResponse = await request(app)
      .get('/api/hotels?location=goa&minPrice=2000&maxPrice=6000');

    expect(hotelsResponse.status).toBe(200);
    expect(Array.isArray(hotelsResponse.body)).toBe(true);
    expect(hotelsResponse.body.length).toBeGreaterThan(0);
  });

  test('fetch hotel detail and book room', async () => {
    const hotelsResponse = await request(app).get('/api/hotels');
    const hotelId = hotelsResponse.body[0].id;

    const detailResponse = await request(app).get(`/api/hotels/${hotelId}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.rooms.length).toBeGreaterThan(0);

    const roomId = detailResponse.body.rooms[0].id;

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        roomId,
        checkIn: '2026-03-01',
        checkOut: '2026-03-03',
        roomsBooked: 1
      });

    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.body.roomId).toBe(roomId);
  });

  test('fetch current user bookings', async () => {
    const bookingsResponse = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${authToken}`);

    expect(bookingsResponse.status).toBe(200);
    expect(Array.isArray(bookingsResponse.body)).toBe(true);
    expect(bookingsResponse.body.length).toBeGreaterThan(0);
  });
});
