require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const pool = require('./pool');

const migrate = async () => {
  const client = await pool.connect();
  try {
    // Drop tables in correct order (respecting foreign keys)
    await client.query(`
      DROP TABLE IF EXISTS bookings;
      DROP TABLE IF EXISTS rooms;
      DROP TABLE IF EXISTS hotels;
      DROP TABLE IF EXISTS users;
    `);

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE hotels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        location VARCHAR(200) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        rating NUMERIC(2,1) DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_type VARCHAR(100) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        capacity INTEGER DEFAULT 2,
        total_rooms INTEGER DEFAULT 1,
        available_rooms INTEGER DEFAULT 1,
        amenities TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        guests INTEGER DEFAULT 1,
        rooms_booked INTEGER NOT NULL DEFAULT 1,
        total_price NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'requested',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
