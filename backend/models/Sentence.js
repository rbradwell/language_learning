// models/Sentence.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sentence = sequelize.define('Sentence', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    nativeText: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Complete sentence in native language (English)'
    },
    targetText: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Complete sentence in target language'
    },
    vocabularyIds: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of vocabulary IDs that make up this sentence'
    },
    wordPositions: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array mapping each word position to vocabulary ID'
    },
    difficulty: {
      type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
      allowNull: false,
      defaultValue: 'beginner'
    },
    sentenceLength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Number of words in the sentence'
    },
    grammarPattern: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Grammar pattern used (e.g., Subject-Verb-Object)'
    }
  });

  Sentence.associate = (models) => {
    Sentence.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
  };

  return Sentence;
};