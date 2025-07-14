'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SentenceCompletionExercises', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      trailStepId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TrailSteps',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sentenceIds: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of sentence IDs for this exercise (exactly 10 sentences)'
      },
      difficulty: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner'
      },
      instructions: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Complete each sentence by placing the missing words in the correct positions'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Category name for this exercise'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Order of this exercise within the trail step'
      },
      missingWordCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 3,
        comment: 'Number of words to remove from each sentence (2-4)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('SentenceCompletionExercises', ['trailStepId']);
    await queryInterface.addIndex('SentenceCompletionExercises', ['difficulty']);
    await queryInterface.addIndex('SentenceCompletionExercises', ['category']);
    await queryInterface.addIndex('SentenceCompletionExercises', ['trailStepId', 'order']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SentenceCompletionExercises');
  }
};