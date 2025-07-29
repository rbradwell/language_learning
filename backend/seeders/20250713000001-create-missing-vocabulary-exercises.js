// seeders/20250713000001-create-missing-vocabulary-exercises.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Creating missing VocabularyMatchingExercises...');
      
      // Get all vocabulary_matching trail steps that don't have exercises
      const vocabularyMatchingSteps = await queryInterface.sequelize.query(`
        SELECT ts.id, ts.name, t."categoryId", c.name as "categoryName", c.language
        FROM "TrailSteps" ts 
        JOIN "Trails" t ON ts."trailId" = t.id 
        JOIN "Categories" c ON t."categoryId" = c.id
        WHERE ts.type = 'vocabulary_matching'
        AND NOT EXISTS (
          SELECT 1 FROM "VocabularyMatchingExercises" vme 
          WHERE vme."trailStepId" = ts.id
        )
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${vocabularyMatchingSteps.length} trail steps needing vocabulary exercises`);

      // Get vocabulary for each category
      const vocabularyMatchingExercises = [];
      
      for (const step of vocabularyMatchingSteps) {
        // Get vocabulary for this category
        const vocabularies = await queryInterface.sequelize.query(`
          SELECT id FROM "Vocabularies" 
          WHERE "categoryId" = :categoryId 
          ORDER BY difficulty ASC, "createdAt" ASC 
          LIMIT 10
        `, {
          replacements: { categoryId: step.categoryId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        if (vocabularies.length > 0) {
          const vocabularyIds = vocabularies.map(v => v.id);
          
          vocabularyMatchingExercises.push({
            id: uuidv4(),
            trailStepId: step.id,
            vocabularyIds: JSON.stringify(vocabularyIds),
            instructions: 'Match the words with their translations',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log(`Created exercise for ${step.categoryName} (${step.language}) with ${vocabularyIds.length} vocabulary items`);
        } else {
          console.log(`Warning: No vocabulary found for category ${step.categoryName}`);
        }
      }

      if (vocabularyMatchingExercises.length > 0) {
        await queryInterface.bulkInsert('VocabularyMatchingExercises', vocabularyMatchingExercises, { transaction });
        console.log(`Successfully created ${vocabularyMatchingExercises.length} vocabulary matching exercises`);
      } else {
        console.log('No vocabulary matching exercises to create');
      }

      await transaction.commit();
      console.log('VocabularyMatchingExercises seeding completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating VocabularyMatchingExercises:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Delete all VocabularyMatchingExercises created by this seeder
      await queryInterface.sequelize.query(`
        DELETE FROM "VocabularyMatchingExercises" 
        WHERE "createdAt" >= '2025-07-13'
      `, { transaction });
      
      await transaction.commit();
      console.log('VocabularyMatchingExercises rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};