// backend/models/UserProgress.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserProgress = sequelize.define('UserProgress', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    trailStepId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  });

  UserProgress.associate = (models) => {
    UserProgress.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    UserProgress.belongsTo(models.TrailStep, {
      foreignKey: 'trailStepId',
      as: 'trailStep'
    });
  };

  return UserProgress;
};
