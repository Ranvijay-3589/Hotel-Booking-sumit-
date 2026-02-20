const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { dbFile } = require('../config');

let db;

async function getDb() {
  if (db) return db;
  db = await open({
    filename: dbFile,
    driver: sqlite3.Database
  });
  await db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

async function initDb() {
  const database = await getDb();

  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      room_type TEXT NOT NULL,
      price_per_night REAL NOT NULL,
      total_rooms INTEGER NOT NULL,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      rooms_booked INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);

  await seedHotelsIfNeeded(database);
}

async function seedHotelsIfNeeded(database) {
  const existing = await database.get('SELECT COUNT(*) as count FROM hotels');
  if (existing.count > 0) return;

  await database.exec('BEGIN');
  try {
    const hotels = [
      {
        name: 'Sea Breeze Resort',
        location: 'Goa',
        description: 'Beachfront property with sunset view rooms.',
        rooms: [
          { roomType: 'Standard', price: 3200, total: 8 },
          { roomType: 'Deluxe', price: 5200, total: 5 }
        ]
      },
      {
        name: 'City Central Inn',
        location: 'Delhi',
        description: 'Business-friendly stay in the city center.',
        rooms: [
          { roomType: 'Standard', price: 2800, total: 12 },
          { roomType: 'Suite', price: 6500, total: 4 }
        ]
      },
      {
        name: 'Himalayan Escape',
        location: 'Manali',
        description: 'Mountain view cottages and premium suites.',
        rooms: [
          { roomType: 'Cottage', price: 4500, total: 6 },
          { roomType: 'Premium Suite', price: 7800, total: 3 }
        ]
      }
    ];

    for (const hotel of hotels) {
      const result = await database.run(
        'INSERT INTO hotels (name, location, description) VALUES (?, ?, ?)',
        hotel.name,
        hotel.location,
        hotel.description
      );
      const hotelId = result.lastID;

      for (const room of hotel.rooms) {
        await database.run(
          'INSERT INTO rooms (hotel_id, room_type, price_per_night, total_rooms) VALUES (?, ?, ?, ?)',
          hotelId,
          room.roomType,
          room.price,
          room.total
        );
      }
    }

    await database.exec('COMMIT');
  } catch (error) {
    await database.exec('ROLLBACK');
    throw error;
  }
}

module.exports = {
  getDb,
  initDb
};
