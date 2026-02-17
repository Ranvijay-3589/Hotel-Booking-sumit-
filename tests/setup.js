const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
process.env.NODE_ENV = 'test';

const { sequelize } = require('../server/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
