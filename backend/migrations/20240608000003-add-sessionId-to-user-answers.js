// migrations/20240608000001-add-sessionId-to-user-answers.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('UserAnswers', 'sessionId', {
      type: Sequelize.UUID,
      allowNull: true, // Nullable for backwards compatibility with existing data
      references: {
        model: 'ExerciseSessions',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for performance
    await queryInterface.addIndex('UserAnswers', ['sessionId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('UserAnswers', ['sessionId']);
    await queryInterface.removeColumn('UserAnswers', 'sessionId');
  }
};