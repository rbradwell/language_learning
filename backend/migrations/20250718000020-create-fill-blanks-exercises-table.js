'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Creating FillBlanksExercises table...');
      
      // Create FillBlanksExercises table (copy of SentenceCompletionExercises)
      await queryInterface.createTable('FillBlanksExercises', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
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
          defaultValue: 'Complete each sentence by typing missing words in pinyin. The pinyin will be converted to Chinese characters that you can use to build the sentence.'
        },
        category: {
          type: Sequelize.STRING,
          allowNull: false,
          comment: 'Category name for this exercise'
        },
        order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
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
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      console.log('FillBlanksExercises table created successfully');
      
      await transaction.commit();
      console.log('Migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating FillBlanksExercises table:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.dropTable('FillBlanksExercises', { transaction });
      await transaction.commit();
      console.log('FillBlanksExercises table dropped successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};