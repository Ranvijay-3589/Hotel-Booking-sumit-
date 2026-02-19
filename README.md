# Hotel Booking

A full-stack hotel booking application built with Node.js/Express, PostgreSQL, and React.

## Features

- User registration and login (JWT authentication)
- Search hotels by location and price filters
- View hotel details with room availability
- Book rooms with date selection
- View booking history

## Tech Stack

- **Backend:** Node.js, Express, Sequelize ORM
- **Database:** PostgreSQL
- **Frontend:** React, React Router
- **Authentication:** JWT (JSON Web Tokens)

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/auth/me | Get current user | Yes |
| GET | /api/hotels | Search hotels (with filters) | No |
| GET | /api/hotels/:id | Get hotel details | No |
| POST | /api/bookings | Create a booking | Yes |
| GET | /api/bookings/my | Get user's bookings | Yes |

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

# Seed the database
npm run seed

# Run development server (both backend and frontend)
npm run dev
```

### Running Tests

```bash
npm test
```

## Database Schema

- **users** - User accounts
- **hotels** - Hotel listings
- **rooms** - Hotel rooms with pricing
- **bookings** - User room reservations
