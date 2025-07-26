'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting removal of Trails table and updating TrailSteps...');
      
      // Step 1: Add categoryId column to TrailSteps table
      console.log('Adding categoryId column to TrailSteps...');
      await queryInterface.addColumn('TrailSteps', 'categoryId', {
        type: Sequelize.UUID,
        allowNull: true, // Temporarily allow null during migration
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // Step 2: Populate categoryId in TrailSteps by looking up the trail
      console.log('Populating categoryId in TrailSteps from Trails...');
      await queryInterface.sequelize.query(`
        UPDATE "TrailSteps" 
        SET "categoryId" = (
          SELECT t."categoryId" 
          FROM "Trails" t 
          WHERE t.id = "TrailSteps"."trailId"
        )
      `, { transaction });

      // Step 3: Verify that all TrailSteps now have a categoryId
      const [unlinkedSteps] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM "TrailSteps" WHERE "categoryId" IS NULL
      `, { transaction });
      
      if (unlinkedSteps[0].count > 0) {
        throw new Error(`Found ${unlinkedSteps[0].count} TrailSteps without categoryId. Migration aborted.`);
      }

      // Step 4: Make categoryId NOT NULL
      console.log('Making categoryId NOT NULL...');
      await queryInterface.changeColumn('TrailSteps', 'categoryId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // Step 5: Update any exercises that reference trails to use trailSteps
      console.log('Checking for exercise references to trails...');
      
      // Check if VocabularyMatchingExercises references trails
      const vocabExercisesTableInfo = await queryInterface.describeTable('VocabularyMatchingExercises');
      if (vocabExercisesTableInfo.trailId) {
        console.log('VocabularyMatchingExercises has trailId, this should be trailStepId...');
        // This table should already reference trailStepId, not trailId
      }

      // Check if SentenceCompletionExercises references trails
      const sentenceExercisesTableInfo = await queryInterface.describeTable('SentenceCompletionExercises');
      if (sentenceExercisesTableInfo.trailId) {
        console.log('SentenceCompletionExercises has trailId, this should be trailStepId...');
        // This table should already reference trailStepId, not trailId
      }

      // Check if FillBlanksExercises references trails
      const fillBlanksExercisesTableInfo = await queryInterface.describeTable('FillBlanksExercises');
      if (fillBlanksExercisesTableInfo.trailId) {
        console.log('FillBlanksExercises has trailId, this should be trailStepId...');
        // This table should already reference trailStepId, not trailId
      }

      // Step 6: Remove trailId foreign key constraint from TrailSteps
      console.log('Removing trailId foreign key constraint from TrailSteps...');
      try {
        await queryInterface.removeConstraint('TrailSteps', 'TrailSteps_trailId_fkey', { transaction });
      } catch (error) {
        console.log('Foreign key constraint removal failed, trying alternative names...');
        try {
          await queryInterface.removeConstraint('TrailSteps', 'trailsteps_trailid_foreign', { transaction });
        } catch (error2) {
          console.log('Could not remove foreign key constraint, continuing...');
        }
      }

      // Step 7: Remove trailId column from TrailSteps
      console.log('Removing trailId column from TrailSteps...');
      await queryInterface.removeColumn('TrailSteps', 'trailId', { transaction });

      // Step 8: Drop the Trails table
      console.log('Dropping Trails table...');
      await queryInterface.dropTable('Trails', { transaction });

      await transaction.commit();
      console.log('Successfully removed Trails table and updated TrailSteps to reference Categories directly!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error during migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Reversing removal of Trails table...');
      
      // Step 1: Recreate Trails table
      console.log('Recreating Trails table...');
      await queryInterface.createTable('Trails', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
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
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        description: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        order: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
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

      // Step 2: Populate Trails table with one trail per category
      console.log('Populating Trails table...');
      await queryInterface.sequelize.query(`
        INSERT INTO "Trails" (id, "categoryId", name, description, "order", "isActive", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid() as id,
          c.id as "categoryId",
          c.name || ' Trail' as name,
          'Trail for ' || c.name || ' category' as description,
          1 as "order",
          true as "isActive",
          NOW() as "createdAt",
          NOW() as "updatedAt"
        FROM "Categories" c
        WHERE EXISTS (
          SELECT 1 FROM "TrailSteps" ts WHERE ts."categoryId" = c.id
        )
      `, { transaction });

      // Step 3: Add trailId column back to TrailSteps
      console.log('Adding trailId column back to TrailSteps...');
      await queryInterface.addColumn('TrailSteps', 'trailId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Trails',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // Step 4: Populate trailId in TrailSteps
      console.log('Populating trailId in TrailSteps...');
      await queryInterface.sequelize.query(`
        UPDATE "TrailSteps" 
        SET "trailId" = (
          SELECT t.id 
          FROM "Trails" t 
          WHERE t."categoryId" = "TrailSteps"."categoryId"
        )
      `, { transaction });

      // Step 5: Make trailId NOT NULL
      console.log('Making trailId NOT NULL...');
      await queryInterface.changeColumn('TrailSteps', 'trailId', {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Trails',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }, { transaction });

      // Step 6: Remove categoryId column from TrailSteps
      console.log('Removing categoryId column from TrailSteps...');
      await queryInterface.removeColumn('TrailSteps', 'categoryId', { transaction });

      await transaction.commit();
      console.log('Successfully reversed the migration!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error during rollback:', error);
      throw error;
    }
  }
};