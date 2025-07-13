'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting removal of all Portuguese content...');
      
      // Get count of Portuguese categories before deletion
      const [portugueseCount] = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM \"Categories\" WHERE language = 'Portuguese'",
        { transaction }
      );
      console.log(`Found ${portugueseCount[0].count} Portuguese categories to remove`);
      
      // Get all Portuguese category IDs first
      const [portugueseCategories] = await queryInterface.sequelize.query(
        "SELECT id FROM \"Categories\" WHERE language = 'Portuguese'",
        { transaction }
      );
      
      if (portugueseCategories.length === 0) {
        console.log('No Portuguese categories found to delete');
        await transaction.commit();
        return;
      }
      
      const categoryIds = portugueseCategories.map(cat => cat.id);
      
      // Get all Portuguese trail IDs
      const [portugueseTrails] = await queryInterface.sequelize.query(
        `SELECT id FROM "Trails" WHERE "categoryId" IN (${categoryIds.map(() => '?').join(',')})`,
        { replacements: categoryIds, transaction }
      );
      
      if (portugueseTrails.length > 0) {
        const trailIds = portugueseTrails.map(trail => trail.id);
        
        // Get all Portuguese trail step IDs
        const [portugueseTrailSteps] = await queryInterface.sequelize.query(
          `SELECT id FROM "TrailSteps" WHERE "trailId" IN (${trailIds.map(() => '?').join(',')})`,
          { replacements: trailIds, transaction }
        );
        
        if (portugueseTrailSteps.length > 0) {
          const trailStepIds = portugueseTrailSteps.map(step => step.id);
          
          // Delete in correct order to avoid FK constraint violations:
          
          // 1. Delete Exercises (references TrailSteps)
          const deletedExercises = await queryInterface.bulkDelete('Exercises', {
            trailStepId: trailStepIds
          }, { transaction });
          console.log(`Deleted ${deletedExercises} Portuguese exercises`);
          
          // 2. Delete VocabularyMatchingExercises (references TrailSteps)  
          const deletedVocabExercises = await queryInterface.bulkDelete('VocabularyMatchingExercises', {
            trailStepId: trailStepIds
          }, { transaction });
          console.log(`Deleted ${deletedVocabExercises} Portuguese vocabulary matching exercises`);
          
          // 3. Delete TrailSteps (references Trails)
          const deletedTrailSteps = await queryInterface.bulkDelete('TrailSteps', {
            trailId: trailIds
          }, { transaction });
          console.log(`Deleted ${deletedTrailSteps} Portuguese trail steps`);
        }
        
        // 4. Delete Trails (references Categories)
        const deletedTrails = await queryInterface.bulkDelete('Trails', {
          categoryId: categoryIds
        }, { transaction });
        console.log(`Deleted ${deletedTrails} Portuguese trails`);
      }
      
      // 5. Delete Vocabularies (references Categories - this should CASCADE)
      const deletedVocabularies = await queryInterface.bulkDelete('Vocabularies', {
        categoryId: categoryIds
      }, { transaction });
      console.log(`Deleted ${deletedVocabularies} Portuguese vocabularies`);
      
      // 6. Finally delete Categories
      const deletedCategories = await queryInterface.bulkDelete('Categories', {
        language: 'Portuguese'
      }, { transaction });
      
      console.log(`Successfully removed ${deletedCategories} Portuguese categories and all related content`);
      
      await transaction.commit();
      console.log('Portuguese content removal completed successfully');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error removing Portuguese content:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This migration is not easily reversible as it deletes data
    // To reverse, you would need to re-run the original seeders
    console.log('WARNING: This migration removes data and is not easily reversible.');
    console.log('To restore Portuguese content, you would need to:');
    console.log('1. Re-run the original seeders that contain Portuguese data');
    console.log('2. Or manually restore from a database backup');
    
    throw new Error('Rollback not supported for data deletion migration. Restore from seeders or backup if needed.');
  }
};