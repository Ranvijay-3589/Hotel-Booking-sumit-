const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Hotel = sequelize.define('Hotel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Hotel name is required' }
    }
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Location is required' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(2, 1),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  amenities: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('amenities');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('amenities', JSON.stringify(val));
    }
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  tableName: 'hotels',
  timestamps: true,
  underscored: true
});

module.exports = Hotel;
