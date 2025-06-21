// models/UserAnswer.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserAnswer = sequelize.define('UserAnswer', {
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
      comment: 'All answers must reference an exercise'
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Only vocabulary_matching exercises use sessions'
    },
    vocabularyId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Only vocabulary_matching exercises reference vocabulary'
    },
    userAnswer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    correctAnswer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isCorrect: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    timeSpent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Time spent on this individual answer in seconds'
    },
    questionData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional question context for non-vocabulary exercises'
    }
  });

  UserAnswer.associate = (models) => {
    UserAnswer.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    UserAnswer.belongsTo(models.Exercise, {
      foreignKey: 'exerciseId',
      as: 'exercise'
    });
    UserAnswer.belongsTo(models.ExerciseSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
    UserAnswer.belongsTo(models.Vocabulary, {
      foreignKey: 'vocabularyId',
      as: 'vocabulary'
    });
  };

  return UserAnswer;
};