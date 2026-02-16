# Hotel Booking MVP

A web-based hotel booking MVP with JWT auth, hotel search/filtering, room availability, and booking management.

## Tech Stack

- Node.js + Express
- SQLite (4 tables: users, hotels, rooms, bookings)
- Vanilla HTML/CSS/JS frontend
- Jest + Supertest tests

## Setup

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000` by default.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/hotels`
- `GET /api/hotels/:id`
- `POST /api/bookings`
- `GET /api/bookings/my`

## Pages

- `/register.html`
- `/login.html`
- `/hotels.html`
- `/hotel.html?id=<hotelId>`
- `/booking-confirmation.html`
- `/my-bookings.html`

## Test

```bash
npm test
```
