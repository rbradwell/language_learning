  // models/TrailStep.js
  module.exports = (sequelize) => {
    const TrailStep = sequelize.define('TrailStep', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      trailId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
        allowNull: false
      },
      stepNumber: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      passingScore: {
        type: DataTypes.INTEGER,
        defaultValue: 70
      },
      timeLimit: {
        type: DataTypes.INTEGER, // in seconds
        defaultValue: 300
      }
    });
  
    TrailStep.associate = (models) => {
      TrailStep.belongsTo(models.Trail);
      TrailStep.hasMany(models.Exercise);
      TrailStep.hasMany(models.UserProgress);
    };
  
    return TrailStep;
  };