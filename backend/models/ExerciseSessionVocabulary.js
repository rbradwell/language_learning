const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExerciseSessionVocabulary = sequelize.define('ExerciseSessionVocabulary', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sessionId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    vocabularyId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  }, {
    // Add unique constraint to prevent duplicate vocabulary in same session
    indexes: [
      {
        unique: true,
        fields: ['sessionId', 'vocabularyId']
      }
    ]
  });

  ExerciseSessionVocabulary.associate = (models) => {
    // This is a junction table, associations are handled in the main models
  };

  return ExerciseSessionVocabulary;
};