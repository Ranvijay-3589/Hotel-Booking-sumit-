const { sequelize, Sequelize } = require('../config/database');

const Hotel = sequelize.define('Hotel', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Hotel name is required' },
    },
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  location: {
    type: Sequelize.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Location is required' },
    },
  },
  address: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
  rating: {
    type: Sequelize.DECIMAL(2, 1),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5,
    },
  },
  amenities: {
    type: Sequelize.TEXT,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('amenities');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(val) {
      this.setDataValue('amenities', JSON.stringify(val || []));
    },
  },
  image: {
    type: Sequelize.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'hotels',
  timestamps: true,
});

module.exports = Hotel;
