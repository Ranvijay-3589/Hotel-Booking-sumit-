# Hotel Booking

A full-stack web application for searching, viewing, and booking hotel rooms. Built with Node.js/Express backend and React frontend.

## Tech Stack

- **Backend:** Node.js, Express, Sequelize ORM, PostgreSQL
- **Frontend:** React 18, React Router, Axios
- **Auth:** JWT (JSON Web Tokens), bcryptjs
- **Testing:** Jest, Supertest

## Features

- User registration and login with JWT authentication
- Hotel search with location and price filters
- Hotel detail view with room availability
- Room booking with date selection and price calculation
- Personal bookings dashboard

## Project Structure

```
book-hotel/
├── server/
│   ├── config/         # Database configuration
│   ├── controllers/    # Route handlers
│   ├── middleware/      # JWT auth middleware
│   ├── models/         # Sequelize models (User, Hotel, Room, Booking)
│   ├── routes/         # Express routes
│   ├── seeds/          # Database seed data
│   └── index.js        # Express app entry point
├── client/
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── context/    # React context (Auth)
│       ├── pages/      # Page components
│       └── services/   # API service layer
├── tests/              # Backend API tests
└── package.json
```

## API Endpoints

| Method | Endpoint           | Auth | Description              |
|--------|-------------------|------|--------------------------|
| POST   | /api/auth/register | No   | Register a new user      |
| POST   | /api/auth/login    | No   | Login                    |
| GET    | /api/auth/me       | Yes  | Get current user profile |
| GET    | /api/hotels        | No   | Search hotels            |
| GET    | /api/hotels/:id    | No   | Get hotel details        |
| POST   | /api/bookings      | Yes  | Create a booking         |
| GET    | /api/bookings/my   | Yes  | Get user's bookings      |

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Installation

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Set up environment variables
cp .env.example .env  # Edit with your DB credentials

# Create database
createdb hotel_booking

# Seed database with sample data
npm run seed
```

### Running

```bash
# Development (both server + client)
npm run dev

# Server only
npm run server

# Client only
npm run client

# Run tests
npm test
```

### Demo Account

After seeding, use: `demo@example.com` / `password123`

## Database Schema

- **users** - id, name, email, password
- **hotels** - id, name, description, location, address, rating, amenities, image
- **rooms** - id, hotel_id, type, description, price, capacity, total_rooms, available
- **bookings** - id, user_id, room_id, hotel_id, check_in, check_out, guests, total_price, status
