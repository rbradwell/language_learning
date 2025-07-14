'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sentences', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nativeText: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Complete sentence in native language (English)'
      },
      targetText: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Complete sentence in target language'
      },
      vocabularyIds: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array of vocabulary IDs that make up this sentence'
      },
      wordPositions: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Array mapping each word position to vocabulary ID'
      },
      difficulty: {
        type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: false,
        defaultValue: 'beginner'
      },
      sentenceLength: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Number of words in the sentence'
      },
      grammarPattern: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Grammar pattern used (e.g., Subject-Verb-Object)'
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
    await queryInterface.addIndex('Sentences', ['categoryId']);
    await queryInterface.addIndex('Sentences', ['difficulty']);
    await queryInterface.addIndex('Sentences', ['sentenceLength']);
    await queryInterface.addIndex('Sentences', ['categoryId', 'difficulty']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sentences');
  }
};