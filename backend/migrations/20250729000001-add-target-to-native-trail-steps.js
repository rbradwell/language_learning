'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Adding target_to_native trail steps...');
      
      // Get all existing vocabulary_matching trail steps
      const vocabSteps = await queryInterface.sequelize.query(`
        SELECT ts.id, ts.name, ts."categoryId", ts."stepNumber", ts."passingScore", ts."timeLimit",
               c.name as "categoryName", c.language
        FROM "TrailSteps" ts
        JOIN "Categories" c ON ts."categoryId" = c.id
        WHERE ts.type = 'vocabulary_matching'
        ORDER BY c.difficulty ASC, c.name ASC, ts."stepNumber" ASC
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${vocabSteps.length} existing vocabulary matching steps`);

      // Get the highest step number for each category to know where to insert new steps
      const maxStepNumbers = await queryInterface.sequelize.query(`
        SELECT "categoryId", MAX("stepNumber") as "maxStepNumber"
        FROM "TrailSteps"
        GROUP BY "categoryId"
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      const maxStepByCategory = {};
      maxStepNumbers.forEach(row => {
        maxStepByCategory[row.categoryId] = row.maxStepNumber;
      });

      const newTrailSteps = [];
      const newExercises = [];

      for (const step of vocabSteps) {
        // Create target_to_native trail step
        const newStepNumber = maxStepByCategory[step.categoryId] + 1;
        maxStepByCategory[step.categoryId] = newStepNumber; // Update for next iteration
        
        const newStepId = uuidv4();
        const newStep = {
          id: newStepId,
          categoryId: step.categoryId,
          name: step.name.replace('Vocabulary Matching', 'Chinese Recognition'),
          type: 'vocabulary_matching_reverse', // New type for reverse direction
          stepNumber: newStepNumber,
          passingScore: step.passingScore,
          timeLimit: step.timeLimit,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        newTrailSteps.push(newStep);

        // Get the vocabulary IDs from the original exercise
        const originalExercises = await queryInterface.sequelize.query(`
          SELECT "vocabularyIds"
          FROM "VocabularyMatchingExercises"
          WHERE "trailStepId" = :trailStepId
        `, {
          replacements: { trailStepId: step.id },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        if (originalExercises.length > 0) {
          // Create matching exercise for the new step
          let vocabularyIds = originalExercises[0].vocabularyIds;
          
          // Ensure vocabularyIds is properly formatted as JSON
          if (typeof vocabularyIds === 'string') {
            try {
              vocabularyIds = JSON.parse(vocabularyIds);
            } catch (e) {
              // If it's not valid JSON, treat it as a single item array
              vocabularyIds = [vocabularyIds];
            }
          }
          
          const newExercise = {
            id: uuidv4(),
            trailStepId: newStepId,
            vocabularyIds: JSON.stringify(vocabularyIds), // Ensure it's JSON string
            instructions: 'Select the English translation for each Chinese word',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          newExercises.push(newExercise);
        }

        console.log(`Created reverse step for: ${step.categoryName} - ${step.name}`);
      }

      // Insert new trail steps
      if (newTrailSteps.length > 0) {
        await queryInterface.bulkInsert('TrailSteps', newTrailSteps, { transaction });
        console.log(`Created ${newTrailSteps.length} new target_to_native trail steps`);
      }

      // Insert new exercises
      if (newExercises.length > 0) {
        await queryInterface.bulkInsert('VocabularyMatchingExercises', newExercises, { transaction });
        console.log(`Created ${newExercises.length} new target_to_native exercises`);
      }

      await transaction.commit();
      console.log('Target_to_native trail steps creation completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating target_to_native trail steps:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Removing target_to_native trail steps...');
      
      // Delete exercises for reverse steps
      await queryInterface.sequelize.query(`
        DELETE FROM "VocabularyMatchingExercises" 
        WHERE "trailStepId" IN (
          SELECT id FROM "TrailSteps" WHERE type = 'vocabulary_matching_reverse'
        )
      `, { transaction });
      
      // Delete the trail steps
      await queryInterface.sequelize.query(`
        DELETE FROM "TrailSteps" 
        WHERE type = 'vocabulary_matching_reverse'
      `, { transaction });
      
      await transaction.commit();
      console.log('Target_to_native trail steps rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};