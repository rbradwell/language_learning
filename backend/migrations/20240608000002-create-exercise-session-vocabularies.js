// migrations/20240608000003-create-exercise-session-vocabularies.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ExerciseSessionVocabularies', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      sessionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'ExerciseSessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vocabularyId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Vocabularies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('ExerciseSessionVocabularies', ['sessionId']);
    await queryInterface.addIndex('ExerciseSessionVocabularies', ['vocabularyId']);
    
    // Add unique constraint to prevent duplicate vocabulary in same session
    await queryInterface.addConstraint('ExerciseSessionVocabularies', {
      fields: ['sessionId', 'vocabularyId'],
      type: 'unique',
      name: 'unique_session_vocabulary'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ExerciseSessionVocabularies');
  }
};