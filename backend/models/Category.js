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
      },
      iconPath: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Path to the category icon component'
      }
    });
  
    Category.associate = (models) => {
      Category.hasMany(models.Vocabulary, {
        foreignKey: 'categoryId'
      });
      Category.hasMany(models.TrailStep, {
        foreignKey: 'categoryId',
        as: 'trailSteps'
      });
      Category.hasMany(models.Sentence, {
        foreignKey: 'categoryId',
        as: 'sentences'
      });
    };
  
    return Category;
};