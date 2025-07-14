'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Adding sentence completion trail steps...');
      
      // Get all trails and their last step numbers
      const trails = await queryInterface.sequelize.query(`
        SELECT t.id, t.name, t."categoryId", c.name as "categoryName", c.language,
               COALESCE(MAX(ts."stepNumber"), 0) as "lastStepNumber"
        FROM "Trails" t
        JOIN "Categories" c ON t."categoryId" = c.id
        LEFT JOIN "TrailSteps" ts ON t.id = ts."trailId"
        WHERE c.language = 'Mandarin'
        GROUP BY t.id, t.name, t."categoryId", c.name, c.language
        ORDER BY t."order" ASC
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${trails.length} trails for adding sentence completion steps`);

      const newTrailSteps = [];
      
      for (const trail of trails) {
        // Add 3 sentence completion trail steps (beginner, intermediate, advanced)
        const sentenceSteps = [
          {
            name: `${trail.categoryName} Sentences - Beginner`,
            type: 'sentence_completion',
            stepNumber: trail.lastStepNumber + 1,
            passingScore: 70,
            timeLimit: 600 // 10 minutes
          },
          {
            name: `${trail.categoryName} Sentences - Intermediate`, 
            type: 'sentence_completion',
            stepNumber: trail.lastStepNumber + 2,
            passingScore: 75,
            timeLimit: 900 // 15 minutes
          },
          {
            name: `${trail.categoryName} Sentences - Advanced`,
            type: 'sentence_completion',
            stepNumber: trail.lastStepNumber + 3,
            passingScore: 80,
            timeLimit: 1200 // 20 minutes
          }
        ];

        sentenceSteps.forEach(step => {
          newTrailSteps.push({
            id: uuidv4(),
            trailId: trail.id,
            name: step.name,
            type: step.type,
            stepNumber: step.stepNumber,
            passingScore: step.passingScore,
            timeLimit: step.timeLimit,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });

        console.log(`Added 3 sentence completion steps for trail: ${trail.name}`);
      }

      if (newTrailSteps.length > 0) {
        await queryInterface.bulkInsert('TrailSteps', newTrailSteps, { transaction });
        console.log(`Successfully created ${newTrailSteps.length} sentence completion trail steps`);
      }

      await transaction.commit();
      console.log('Sentence completion trail steps creation completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating sentence completion trail steps:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Delete all sentence completion trail steps created by this migration
      await queryInterface.sequelize.query(`
        DELETE FROM "TrailSteps" 
        WHERE type = 'sentence_completion' 
        AND "createdAt" >= '2025-07-13'
      `, { transaction });
      
      await transaction.commit();
      console.log('Sentence completion trail steps rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};