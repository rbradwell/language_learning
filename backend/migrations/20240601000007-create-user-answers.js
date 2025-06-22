// backend/migrations/20240601000007-create-user-answers.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserAnswers', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      vocabularyId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Vocabularies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      exerciseId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Exercises',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      userAnswer: {
        type: Sequelize.STRING,
        allowNull: false
      },
      correctAnswer: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isCorrect: {
        type: Sequelize.BOOLEAN,
        allowNull: false
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

    await queryInterface.addIndex('UserAnswers', ['userId']);
    await queryInterface.addIndex('UserAnswers', ['vocabularyId']);
    await queryInterface.addIndex('UserAnswers', ['isCorrect']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserAnswers');
  }
};