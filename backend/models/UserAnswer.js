// backend/models/UserAnswer.js
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
    vocabularyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    exerciseId: {
      type: DataTypes.UUID,
      allowNull: true
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
      defaultValue: 0
    }
  });

  UserAnswer.associate = (models) => {
    UserAnswer.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    UserAnswer.belongsTo(models.Vocabulary, {
      foreignKey: 'vocabularyId',
      as: 'vocabulary'
    });
    UserAnswer.belongsTo(models.Exercise, {
      foreignKey: 'exerciseId',
      as: 'exercise'
    });
  };

  return UserAnswer;
};