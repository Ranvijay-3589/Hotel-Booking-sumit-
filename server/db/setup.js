const pool = require('./pool');

async function setup() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        location VARCHAR(200) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        rating NUMERIC(2,1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        room_type VARCHAR(100) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        capacity INTEGER DEFAULT 2,
        total_rooms INTEGER DEFAULT 1,
        available_rooms INTEGER DEFAULT 1,
        amenities TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        guests INTEGER DEFAULT 1,
        total_price NUMERIC(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
