// models/VocabularyMatchingExercises.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VocabularyMatchingExercises = sequelize.define('VocabularyMatchingExercises', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trailStepId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    vocabularyIds: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of vocabulary IDs for this exercise'
    },
    instructions: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Match the words with their translations'
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
    }
  });

  VocabularyMatchingExercises.associate = (models) => {
    VocabularyMatchingExercises.belongsTo(models.TrailStep, {
      foreignKey: 'trailStepId',
      as: 'trailStep'
    });
    VocabularyMatchingExercises.hasOne(models.ExerciseSession, {
      foreignKey: 'exerciseId',
      as: 'session'
    });
  };

  return VocabularyMatchingExercises;
};