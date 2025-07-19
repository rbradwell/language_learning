'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Creating FillBlanksExercises...');
      
      // Get all fill_blanks trail steps
      const fillBlanksSteps = await queryInterface.sequelize.query(`
        SELECT ts.id, ts.name, ts."trailId", ts."stepNumber", c.name as "categoryName", c.language
        FROM "TrailSteps" ts
        JOIN "Trails" t ON ts."trailId" = t.id
        JOIN "Categories" c ON t."categoryId" = c.id
        WHERE ts.type = 'fill_blanks'
        AND c.language = 'Mandarin'
        ORDER BY ts."stepNumber" ASC
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${fillBlanksSteps.length} fill_blanks trail steps`);

      if (fillBlanksSteps.length === 0) {
        console.log('No fill_blanks trail steps found');
        await transaction.commit();
        return;
      }

      // Check if sentences exist for each category
      const categories = [...new Set(fillBlanksSteps.map(step => step.categoryName))];
      console.log(`Checking sentences for categories: ${categories.join(', ')}`);

      const sentenceCounts = await queryInterface.sequelize.query(`
        SELECT c.name as category, COUNT(s.id) as count
        FROM "Categories" c
        LEFT JOIN "Sentences" s ON c.id = s."categoryId"
        WHERE c.name IN (${categories.map(c => `'${c}'`).join(', ')})
        GROUP BY c.name
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log('Sentence counts by category:', sentenceCounts);

      const newExercises = [];
      
      for (const step of fillBlanksSteps) {
        const categoryCount = sentenceCounts.find(sc => sc.category === step.categoryName);
        
        if (!categoryCount || categoryCount.count < 10) {
          console.log(`Skipping ${step.categoryName} - not enough sentences (${categoryCount?.count || 0})`);
          continue;
        }

        // Get random sentences for this category (limit to 10 per exercise)
        const sentences = await queryInterface.sequelize.query(`
          SELECT s.id 
          FROM "Sentences" s
          JOIN "Categories" c ON s."categoryId" = c.id
          WHERE c.name = :category
          ORDER BY RANDOM()
          LIMIT 10
        `, { 
          type: Sequelize.QueryTypes.SELECT, 
          replacements: { category: step.categoryName },
          transaction 
        });

        if (sentences.length >= 10) {
          const sentenceIds = sentences.map(s => s.id);
          
          newExercises.push({
            id: uuidv4(),
            trailStepId: step.id,
            sentenceIds: JSON.stringify(sentenceIds),
            difficulty: 'beginner', // Fill blanks exercises start at beginner level
            instructions: 'Complete each sentence by typing missing words in pinyin. The pinyin will be converted to Chinese characters that you can use to build the sentence.',
            category: step.categoryName,
            order: 1,
            missingWordCount: 3, // Remove 3 words from each sentence
            createdAt: new Date(),
            updatedAt: new Date()
          });

          console.log(`Created fill_blanks exercise for ${step.categoryName} with ${sentenceIds.length} sentences`);
        } else {
          console.log(`Skipping ${step.categoryName} - only ${sentences.length} sentences available`);
        }
      }

      if (newExercises.length > 0) {
        await queryInterface.bulkInsert('FillBlanksExercises', newExercises, { transaction });
        console.log(`Successfully created ${newExercises.length} fill_blanks exercises`);
      } else {
        console.log('No fill_blanks exercises could be created');
      }

      await transaction.commit();
      console.log('Fill_blanks exercises creation completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating fill_blanks exercises:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Delete all fill_blanks exercises
      await queryInterface.bulkDelete('FillBlanksExercises', null, { transaction });
      
      await transaction.commit();
      console.log('Fill_blanks exercises rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};