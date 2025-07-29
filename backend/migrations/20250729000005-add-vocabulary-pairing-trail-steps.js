'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Adding vocabulary pairing trail steps...');
      
      // Get all existing vocabulary_matching_reverse trail steps
      const reverseSteps = await queryInterface.sequelize.query(`
        SELECT ts.id, ts.name, ts."categoryId", ts."stepNumber", ts."passingScore", ts."timeLimit",
               c.name as "categoryName", c.language
        FROM "TrailSteps" ts
        JOIN "Categories" c ON ts."categoryId" = c.id
        WHERE ts.type = 'vocabulary_matching_reverse'
        ORDER BY c.difficulty ASC, c.name ASC, ts."stepNumber" ASC
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${reverseSteps.length} reverse vocabulary matching steps`);

      // For each reverse step, we'll insert a pairing step right after it
      const newTrailSteps = [];
      const newExercises = [];

      for (const step of reverseSteps) {
        console.log(`Processing: ${step.categoryName} - ${step.name}`);
        
        // Shift all steps after this reverse step up by 1
        await queryInterface.sequelize.query(`
          UPDATE "TrailSteps" 
          SET "stepNumber" = "stepNumber" + 1
          WHERE "categoryId" = :categoryId 
            AND "stepNumber" > :currentStepNumber
        `, {
          replacements: { 
            categoryId: step.categoryId,
            currentStepNumber: step.stepNumber 
          },
          transaction
        });

        // Create vocabulary pairing trail step right after the reverse step
        const newStepNumber = step.stepNumber + 1;
        const newStepId = uuidv4();
        
        const newStep = {
          id: newStepId,
          categoryId: step.categoryId,
          name: step.name.replace('Chinese Recognition', 'Vocabulary Pairing'),
          type: 'vocabulary_pairing',
          stepNumber: newStepNumber,
          passingScore: step.passingScore,
          timeLimit: step.timeLimit,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        newTrailSteps.push(newStep);

        // Get the vocabulary IDs from the reverse step's exercise
        const reverseExercises = await queryInterface.sequelize.query(`
          SELECT "vocabularyIds"
          FROM "VocabularyMatchingExercises"
          WHERE "trailStepId" = :trailStepId
        `, {
          replacements: { trailStepId: step.id },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        if (reverseExercises.length > 0) {
          // Create matching exercise for the new pairing step
          let vocabularyIds = reverseExercises[0].vocabularyIds;
          
          // Ensure vocabularyIds is properly formatted as JSON
          if (typeof vocabularyIds === 'string') {
            try {
              vocabularyIds = JSON.parse(vocabularyIds);
            } catch (e) {
              vocabularyIds = [vocabularyIds];
            }
          }
          
          const newExercise = {
            id: uuidv4(),
            trailStepId: newStepId,
            vocabularyIds: JSON.stringify(vocabularyIds),
            instructions: 'Match each English word with its Chinese translation by tapping pairs',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          newExercises.push(newExercise);
        }

        console.log(`Created pairing step for: ${step.categoryName} at position ${newStepNumber}`);
      }

      // Insert new trail steps
      if (newTrailSteps.length > 0) {
        await queryInterface.bulkInsert('TrailSteps', newTrailSteps, { transaction });
        console.log(`Created ${newTrailSteps.length} new vocabulary pairing trail steps`);
      }

      // Insert new exercises
      if (newExercises.length > 0) {
        await queryInterface.bulkInsert('VocabularyMatchingExercises', newExercises, { transaction });
        console.log(`Created ${newExercises.length} new vocabulary pairing exercises`);
      }

      await transaction.commit();
      console.log('Vocabulary pairing trail steps creation completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating vocabulary pairing trail steps:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Removing vocabulary pairing trail steps...');
      
      // Delete exercises for pairing steps
      await queryInterface.sequelize.query(`
        DELETE FROM "VocabularyMatchingExercises" 
        WHERE "trailStepId" IN (
          SELECT id FROM "TrailSteps" WHERE type = 'vocabulary_pairing'
        )
      `, { transaction });
      
      // Delete the trail steps
      await queryInterface.sequelize.query(`
        DELETE FROM "TrailSteps" 
        WHERE type = 'vocabulary_pairing'
      `, { transaction });
      
      await transaction.commit();
      console.log('Vocabulary pairing trail steps rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};