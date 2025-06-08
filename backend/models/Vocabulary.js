// models/Vocabulary.js
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const Vocabulary = sequelize.define('Vocabulary', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      nativeWord: {
        type: DataTypes.STRING,
        allowNull: false
      },
      targetWord: {
        type: DataTypes.STRING,
        allowNull: false
      },
      pronunciation: {
        type: DataTypes.STRING // For Mandarin pinyin or Portuguese pronunciation
      },
      difficulty: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false
      }
    });
  
    Vocabulary.associate = (models) => {
      Vocabulary.belongsTo(models.Category, {
        foreignKey: 'categoryId' 
      });
      Vocabulary.hasMany(models.UserAnswer);
    };
  
    return Vocabulary;
  };