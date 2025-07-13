'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if Exercises table exists
      const tableExists = await queryInterface.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Exercises')",
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (!tableExists[0].exists) {
        console.log('Exercises table does not exist, skipping drop');
        return;
      }
      
      // Get count of records before dropping
      const [recordCount] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM "Exercises"',
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      console.log(`Found ${recordCount.count} records in Exercises table`);
      
      // Drop the Exercises table
      await queryInterface.dropTable('Exercises');
      
      console.log('Successfully dropped Exercises table');
      console.log('Note: ExerciseSessions now only references VocabularyMatchingExercises via exerciseId');
      
    } catch (error) {
      console.error('Error dropping Exercises table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Recreate the Exercises table structure for rollback
    await queryInterface.createTable('Exercises', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
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
      type: {
        type: Sequelize.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
        allowNull: false
      },
      content: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Stores exercise data as JSON (sentences, options, etc.)'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
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

    // Add indexes
    await queryInterface.addIndex('Exercises', ['trailStepId']);
    await queryInterface.addIndex('Exercises', ['type']);
    
    console.log('Recreated Exercises table structure for rollback');
    console.log('WARNING: Original data was not restored. You would need to re-run seeders to restore exercise data.');
  }
};