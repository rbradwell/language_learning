// models/Category.js
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      },
      language: {
        type: DataTypes.ENUM('Mandarin', 'Portuguese'),
        allowNull: false
      },
      difficulty: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      }
    });
  
    Category.associate = (models) => {
      Category.hasMany(models.Vocabulary, {
        foreignKey: 'categoryId'
      });
      Category.hasMany(models.Trail);
    };
  
    return Category;
  };