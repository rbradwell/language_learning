'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove timeSpent column from UserAnswers table
    await queryInterface.removeColumn('UserAnswers', 'timeSpent');
    
    // Remove timeSpent column from UserProgresses table and add completionTime
    await queryInterface.removeColumn('UserProgresses', 'timeSpent');
    await queryInterface.addColumn('UserProgresses', 'completionTime', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Time taken to complete the exercise in seconds'
    });
  },

  async down (queryInterface, Sequelize) {
    // Add timeSpent back to UserAnswers table
    await queryInterface.addColumn('UserAnswers', 'timeSpent', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
    
    // Remove completionTime and add timeSpent back to UserProgresses table
    await queryInterface.removeColumn('UserProgresses', 'completionTime');
    await queryInterface.addColumn('UserProgresses', 'timeSpent', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });
  }
};
