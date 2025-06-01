// models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    nativeLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'English'
    },
    targetLanguage: {
      type: DataTypes.ENUM('Mandarin', 'Portuguese'),
      allowNull: false
    },
    totalScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  });

  User.associate = (models) => {
    User.hasMany(models.UserProgress);
    User.hasMany(models.UserAnswer);
  };

  return User;
};