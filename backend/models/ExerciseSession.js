// models/ExerciseSession.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExerciseSession = sequelize.define('ExerciseSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    exerciseId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Session is scoped to a single exercise'
    },
    trailStepId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Denormalized for easier querying'
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('in_progress', 'completed', 'abandoned'),
      defaultValue: 'in_progress'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from creation
    }
  });

  ExerciseSession.associate = (models) => {
    ExerciseSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    ExerciseSession.belongsTo(models.Exercise, {
      foreignKey: 'exerciseId',
      as: 'exercise'
    });
    ExerciseSession.belongsTo(models.TrailStep, {
      foreignKey: 'trailStepId',
      as: 'trailStep'
    });
    ExerciseSession.hasMany(models.UserAnswer, {
      foreignKey: 'sessionId',
      as: 'answers'
    });
    // Only vocabulary_matching exercises use this relationship
    ExerciseSession.belongsToMany(models.Vocabulary, {
      through: models.ExerciseSessionVocabulary,
      foreignKey: 'sessionId',
      otherKey: 'vocabularyId'
    });
  };

  return ExerciseSession;
};