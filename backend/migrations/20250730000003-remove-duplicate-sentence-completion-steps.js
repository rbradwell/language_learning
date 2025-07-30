'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Removing duplicate sentence completion trail steps...');
      
      // Get all categories
      const categories = await queryInterface.sequelize.query(`
        SELECT id, name, language, difficulty
        FROM "Categories"
        WHERE language = 'Mandarin'
        ORDER BY difficulty ASC, name ASC
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      console.log(`Found ${categories.length} categories`);

      for (const category of categories) {
        console.log(`Processing category: ${category.name}`);
        
        // Get all sentence completion steps for this category, ordered by step number
        const sentenceSteps = await queryInterface.sequelize.query(`
          SELECT id, "stepNumber", "passingScore", name
          FROM "TrailSteps"
          WHERE "categoryId" = :categoryId
            AND type = 'sentence_completion'
          ORDER BY "stepNumber" ASC
        `, {
          replacements: { categoryId: category.id },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        console.log(`Found ${sentenceSteps.length} sentence completion steps for ${category.name}`);

        if (sentenceSteps.length > 1) {
          // Keep only the first sentence completion step (step 5)
          const stepsToDelete = sentenceSteps.slice(1); // Remove all except the first
          
          for (const step of stepsToDelete) {
            console.log(`Deleting step ${step.stepNumber} (${step.name}) with passing score ${step.passingScore}% from ${category.name}`);
            
            // Delete exercises associated with this step
            await queryInterface.sequelize.query(`
              DELETE FROM "SentenceCompletionExercises" 
              WHERE "trailStepId" = :stepId
            `, {
              replacements: { stepId: step.id },
              transaction
            });
            
            // Delete the trail step
            await queryInterface.sequelize.query(`
              DELETE FROM "TrailSteps" 
              WHERE id = :stepId
            `, {
              replacements: { stepId: step.id },
              transaction
            });
          }

          // Renumber remaining steps to close gaps
          console.log(`Renumbering remaining steps for ${category.name}...`);
          
          const remainingSteps = await queryInterface.sequelize.query(`
            SELECT id, "stepNumber"
            FROM "TrailSteps"
            WHERE "categoryId" = :categoryId
            ORDER BY "stepNumber" ASC
          `, {
            replacements: { categoryId: category.id },
            type: Sequelize.QueryTypes.SELECT,
            transaction
          });

          for (let i = 0; i < remainingSteps.length; i++) {
            const newStepNumber = i + 1;
            const currentStep = remainingSteps[i];
            
            if (currentStep.stepNumber !== newStepNumber) {
              await queryInterface.sequelize.query(`
                UPDATE "TrailSteps" 
                SET "stepNumber" = :newStepNumber
                WHERE id = :stepId
              `, {
                replacements: { 
                  newStepNumber: newStepNumber,
                  stepId: currentStep.id 
                },
                transaction
              });
              console.log(`Renumbered step from ${currentStep.stepNumber} to ${newStepNumber}`);
            }
          }
        }
      }

      await transaction.commit();
      console.log('Duplicate sentence completion steps removal completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error removing duplicate sentence completion steps:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('Note: This migration cannot be easily reversed.');
    console.log('The duplicate sentence completion steps and their exercises have been permanently removed.');
    console.log('You would need to recreate them manually if needed.');
  }
};