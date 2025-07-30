'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Adding vocabulary flashcards trail steps as step 1...');
      
      // Get all categories
      const categories = await queryInterface.sequelize.query(`
        SELECT id, name, language, difficulty
        FROM "Categories"
        WHERE language = 'Mandarin'
        ORDER BY difficulty ASC, name ASC
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${categories.length} categories`);

      const newTrailSteps = [];
      const newExercises = [];

      for (const category of categories) {
        console.log(`Processing category: ${category.name}`);
        
        // Shift all existing steps up by 1 to make room for flashcards at step 1
        await queryInterface.sequelize.query(`
          UPDATE "TrailSteps" 
          SET "stepNumber" = "stepNumber" + 1
          WHERE "categoryId" = :categoryId
        `, {
          replacements: { categoryId: category.id },
          transaction
        });

        // Create vocabulary flashcards trail step as step 1
        const newStepId = uuidv4();
        
        const newStep = {
          id: newStepId,
          categoryId: category.id,
          name: 'Vocabulary Review',
          type: 'vocabulary_flashcards',
          stepNumber: 1,
          passingScore: 0, // No scoring for flashcards
          timeLimit: 0, // No time limit for flashcards
          createdAt: new Date(),
          updatedAt: new Date()
        };

        newTrailSteps.push(newStep);

        // Get vocabulary for this category from existing vocabulary matching exercises
        const existingVocabExercises = await queryInterface.sequelize.query(`
          SELECT vme."vocabularyIds"
          FROM "VocabularyMatchingExercises" vme
          JOIN "TrailSteps" ts ON vme."trailStepId" = ts.id
          WHERE ts."categoryId" = :categoryId
            AND ts.type = 'vocabulary_matching'
          LIMIT 1
        `, {
          replacements: { categoryId: category.id },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        if (existingVocabExercises.length > 0) {
          // Create flashcard exercise for the new step
          let vocabularyIds = existingVocabExercises[0].vocabularyIds;
          
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
            instructions: 'Review vocabulary cards by tapping to flip and swiping right to dismiss',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          newExercises.push(newExercise);
        }

        console.log(`Created flashcards step for: ${category.name} at position 1`);
      }

      // Insert new trail steps
      if (newTrailSteps.length > 0) {
        await queryInterface.bulkInsert('TrailSteps', newTrailSteps, { transaction });
        console.log(`Created ${newTrailSteps.length} new vocabulary flashcards trail steps`);
      }

      // Insert new exercises
      if (newExercises.length > 0) {
        await queryInterface.bulkInsert('VocabularyMatchingExercises', newExercises, { transaction });
        console.log(`Created ${newExercises.length} new vocabulary flashcards exercises`);
      }

      await transaction.commit();
      console.log('Vocabulary flashcards trail steps creation completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating vocabulary flashcards trail steps:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Removing vocabulary flashcards trail steps...');
      
      // Delete exercises for flashcards steps
      await queryInterface.sequelize.query(`
        DELETE FROM "VocabularyMatchingExercises" 
        WHERE "trailStepId" IN (
          SELECT id FROM "TrailSteps" WHERE type = 'vocabulary_flashcards'
        )
      `, { transaction });
      
      // Delete the trail steps
      await queryInterface.sequelize.query(`
        DELETE FROM "TrailSteps" 
        WHERE type = 'vocabulary_flashcards'
      `, { transaction });
      
      // Shift remaining steps back down by 1
      await queryInterface.sequelize.query(`
        UPDATE "TrailSteps" 
        SET "stepNumber" = "stepNumber" - 1
        WHERE "stepNumber" > 1
      `, { transaction });
      
      await transaction.commit();
      console.log('Vocabulary flashcards trail steps rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};