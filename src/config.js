const path = require('path');

module.exports = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  dbFile: process.env.DB_FILE || path.join(process.cwd(), 'data.sqlite')
};
