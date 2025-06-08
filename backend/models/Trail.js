// models/Trail.js
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => {
    const Trail = sequelize.define('Trail', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
  
    Trail.associate = (models) => {
      Trail.belongsTo(models.Category, {
        foreignKey: 'categoryId'
      });
      Trail.hasMany(models.TrailStep, {
        foreignKey: 'trailId'
      });
    };
  
    return Trail;
  };
  