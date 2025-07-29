'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Fixing reverse trail step order...');
      
      // Get all categories and their trail steps
      const categories = await queryInterface.sequelize.query(`
        SELECT DISTINCT ts."categoryId", c.name as "categoryName"
        FROM "TrailSteps" ts
        JOIN "Categories" c ON ts."categoryId" = c.id
        WHERE c.language = 'Mandarin'
        ORDER BY c.name
      `, { type: Sequelize.QueryTypes.SELECT, transaction });

      for (const category of categories) {
        console.log(`\nProcessing category: ${category.categoryName}`);
        
        // Get all trail steps for this category, ordered by step number
        const steps = await queryInterface.sequelize.query(`
          SELECT id, name, type, "stepNumber"
          FROM "TrailSteps"
          WHERE "categoryId" = :categoryId
          ORDER BY "stepNumber" ASC
        `, {
          replacements: { categoryId: category.categoryId },
          type: Sequelize.QueryTypes.SELECT,
          transaction
        });

        // Find the vocabulary_matching step and vocabulary_matching_reverse step
        const vocabStep = steps.find(s => s.type === 'vocabulary_matching');
        const reverseStep = steps.find(s => s.type === 'vocabulary_matching_reverse');
        
        if (!vocabStep || !reverseStep) {
          console.log(`  ⏭️  Skipping ${category.categoryName} - missing vocab steps`);
          continue;
        }

        console.log(`  📍 Current order: Vocab(${vocabStep.stepNumber}) -> Reverse(${reverseStep.stepNumber})`);
        
        // If reverse step is already right after vocab step, skip
        if (reverseStep.stepNumber === vocabStep.stepNumber + 1) {
          console.log(`  ✅ Already in correct order`);
          continue;
        }

        // We need to:
        // 1. Move all steps after vocabulary_matching up by 1
        // 2. Insert vocabulary_matching_reverse at vocabulary_matching + 1
        
        const targetPosition = vocabStep.stepNumber + 1;
        
        // Move all steps that are >= targetPosition up by 1 (except the reverse step)
        await queryInterface.sequelize.query(`
          UPDATE "TrailSteps" 
          SET "stepNumber" = "stepNumber" + 1
          WHERE "categoryId" = :categoryId 
            AND "stepNumber" >= :targetPosition 
            AND type != 'vocabulary_matching_reverse'
        `, {
          replacements: { 
            categoryId: category.categoryId, 
            targetPosition: targetPosition 
          },
          transaction
        });

        // Move the reverse step to the correct position
        await queryInterface.sequelize.query(`
          UPDATE "TrailSteps" 
          SET "stepNumber" = :targetPosition
          WHERE id = :reverseStepId
        `, {
          replacements: { 
            targetPosition: targetPosition,
            reverseStepId: reverseStep.id 
          },
          transaction
        });

        console.log(`  ✅ Moved reverse step to position ${targetPosition}`);
      }

      await transaction.commit();
      console.log('\n🎉 Trail step order fixed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error fixing trail step order:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // This rollback would be complex and is not critical for development
    // In production, you'd want to implement proper rollback logic
    console.log('Rollback not implemented - step order changes are not easily reversible');
  }
};