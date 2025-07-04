// models/Exercise.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Exercise = sequelize.define('Exercise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trailStepId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
      allowNull: false
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Stores exercise configuration and content as JSON'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  });

  Exercise.associate = (models) => {
    Exercise.belongsTo(models.TrailStep, {
      foreignKey: 'trailStepId',
      as: 'trailStep'
    });
    Exercise.hasOne(models.ExerciseSession, {
      foreignKey: 'exerciseId',
      as: 'session'
    });
    Exercise.hasMany(models.UserAnswer, {
      foreignKey: 'exerciseId',
      as: 'answers'
    });
  };

  return Exercise;
};