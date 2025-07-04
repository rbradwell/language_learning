  // models/TrailStep.js
  const { DataTypes } = require('sequelize');
  module.exports = (sequelize) => {
    const TrailStep = sequelize.define('TrailStep', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      trailId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
        allowNull: false
      },
      stepNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      passingScore: {
        type: DataTypes.INTEGER,
        defaultValue: 70
      },
      timeLimit: {
        type: DataTypes.INTEGER, // in seconds
        defaultValue: 300
      }
    });
  
    TrailStep.associate = (models) => {
      TrailStep.belongsTo(models.Trail, {
        foreignKey: 'trailId'
      });
      TrailStep.hasMany(models.Exercise, {
        foreignKey: 'trailStepId'
      });
      TrailStep.hasMany(models.UserProgress, {
        foreignKey: 'trailStepId'
      });
    };
  
    return TrailStep;
  };