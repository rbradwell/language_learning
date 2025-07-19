// models/FillBlanksExercises.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FillBlanksExercises = sequelize.define('FillBlanksExercises', {
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
      defaultValue: 'Complete each sentence by typing missing words in pinyin. The pinyin will be converted to Chinese characters that you can use to build the sentence.'
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

  FillBlanksExercises.associate = (models) => {
    FillBlanksExercises.belongsTo(models.TrailStep, {
      foreignKey: 'trailStepId',
      as: 'trailStep'
    });
    
    FillBlanksExercises.hasOne(models.ExerciseSession, {
      foreignKey: 'exerciseId',
      as: 'session'
    });
  };

  return FillBlanksExercises;
};