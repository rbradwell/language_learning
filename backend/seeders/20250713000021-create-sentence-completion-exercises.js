'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Creating sentence completion exercises...');
      
      // Get all trail steps of type 'sentence_completion' that don't have exercises yet
      const sentenceCompletionSteps = await queryInterface.sequelize.query(`
        SELECT ts.id, ts.name, t."categoryId", c.name as "categoryName", c.language
        FROM "TrailSteps" ts 
        JOIN "Trails" t ON ts."trailId" = t.id 
        JOIN "Categories" c ON t."categoryId" = c.id
        WHERE ts.type = 'sentence_completion'
        AND NOT EXISTS (
          SELECT 1 FROM "SentenceCompletionExercises" sce 
          WHERE sce."trailStepId" = ts.id
        )
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${sentenceCompletionSteps.length} trail steps needing sentence completion exercises`);

      // Create sentence completion exercises
      const exercises = [];
      
      for (const step of sentenceCompletionSteps) {
        // Get sentences for this category grouped by difficulty
        const beginnerSentences = await queryInterface.sequelize.query(`
          SELECT id FROM "Sentences" 
          WHERE "categoryId" = :categoryId 
          AND difficulty = 'beginner'
          ORDER BY "sentenceLength" ASC, "createdAt" ASC
          LIMIT 15
        `, {
          replacements: { categoryId: step.categoryId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        const intermediateSentences = await queryInterface.sequelize.query(`
          SELECT id FROM "Sentences" 
          WHERE "categoryId" = :categoryId 
          AND difficulty = 'intermediate'
          ORDER BY "sentenceLength" ASC, "createdAt" ASC
          LIMIT 15
        `, {
          replacements: { categoryId: step.categoryId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        const advancedSentences = await queryInterface.sequelize.query(`
          SELECT id FROM "Sentences" 
          WHERE "categoryId" = :categoryId 
          AND difficulty = 'advanced'
          ORDER BY "sentenceLength" ASC, "createdAt" ASC
          LIMIT 15
        `, {
          replacements: { categoryId: step.categoryId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        // Create exercises for each difficulty level
        const difficulties = [
          { level: 'beginner', sentences: beginnerSentences, missingWordCount: 2 },
          { level: 'intermediate', sentences: intermediateSentences, missingWordCount: 3 },
          { level: 'advanced', sentences: advancedSentences, missingWordCount: 4 }
        ];

        let exerciseOrder = 1;
        
        for (const difficulty of difficulties) {
          if (difficulty.sentences.length >= 10) {
            // Select exactly 10 sentences for this exercise
            const selectedSentences = difficulty.sentences.slice(0, 10);
            const sentenceIds = selectedSentences.map(s => s.id);
            
            exercises.push({
              id: uuidv4(),
              trailStepId: step.id,
              sentenceIds: JSON.stringify(sentenceIds),
              difficulty: difficulty.level,
              instructions: `Complete each sentence by placing the missing words in the correct positions. ${difficulty.missingWordCount} words will be missing from each sentence.`,
              category: step.categoryName,
              order: exerciseOrder++,
              missingWordCount: difficulty.missingWordCount,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
            console.log(`Created ${difficulty.level} sentence completion exercise for ${step.categoryName} with ${sentenceIds.length} sentences`);
          } else {
            console.log(`Warning: Not enough ${difficulty.level} sentences for ${step.categoryName} (found ${difficulty.sentences.length}, need 10)`);
          }
        }
      }

      if (exercises.length > 0) {
        await queryInterface.bulkInsert('SentenceCompletionExercises', exercises, { transaction });
        console.log(`Successfully created ${exercises.length} sentence completion exercises`);
      } else {
        console.log('No sentence completion exercises to create');
      }

      await transaction.commit();
      console.log('Sentence completion exercises seeding completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating sentence completion exercises:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Delete all sentence completion exercises created by this seeder
      await queryInterface.sequelize.query(`
        DELETE FROM "SentenceCompletionExercises" 
        WHERE "createdAt" >= '2025-07-13'
      `, { transaction });
      
      await transaction.commit();
      console.log('Sentence completion exercises rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};