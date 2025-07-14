// models/SentenceCompletionExercises.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SentenceCompletionExercises = sequelize.define('SentenceCompletionExercises', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trailStepId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    sentenceIds: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of sentence IDs for this exercise (exactly 10 sentences)'
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    instructions: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Complete each sentence by placing the missing words in the correct positions'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Category name for this exercise'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    missingWordCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: 'Number of words to remove from each sentence (2-4)'
    }
  });

  SentenceCompletionExercises.associate = (models) => {
    SentenceCompletionExercises.belongsTo(models.TrailStep, {
      foreignKey: 'trailStepId',
      as: 'trailStep'
    });
    
    SentenceCompletionExercises.hasOne(models.ExerciseSession, {
      foreignKey: 'exerciseId',
      as: 'session'
    });
  };

  return SentenceCompletionExercises;
};