'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Simplifying VocabularyMatchingExercises table...');
      
      // Step 1: Delete all exercises where order != 1 (keep only the first exercise per trail step)
      const deletedCount = await queryInterface.sequelize.query(`
        DELETE FROM "VocabularyMatchingExercises" 
        WHERE "order" != 1
      `, { transaction });
      
      console.log(`Deleted ${deletedCount[1]} VocabularyMatchingExercises with order != 1`);
      
      // Step 2: Drop the index on category column first
      try {
        await queryInterface.removeIndex('VocabularyMatchingExercises', 'vocabulary_matching_exercises_category', { transaction });
        console.log('Dropped index on category column');
      } catch (error) {
        console.log('Index on category column may not exist:', error.message);
      }
      
      // Step 3: Remove the order column
      await queryInterface.removeColumn('VocabularyMatchingExercises', 'order', { transaction });
      console.log('Removed order column from VocabularyMatchingExercises');
      
      // Step 4: Remove the category column
      await queryInterface.removeColumn('VocabularyMatchingExercises', 'category', { transaction });
      console.log('Removed category column from VocabularyMatchingExercises');
      
      await transaction.commit();
      console.log('VocabularyMatchingExercises table simplification completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error simplifying VocabularyMatchingExercises table:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Reverting VocabularyMatchingExercises table changes...');
      
      // Step 1: Add back the order column
      await queryInterface.addColumn('VocabularyMatchingExercises', 'order', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      }, { transaction });
      
      // Step 2: Add back the category column
      await queryInterface.addColumn('VocabularyMatchingExercises', 'category', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Unknown'
      }, { transaction });
      
      // Step 3: Populate category column from trail step data
      await queryInterface.sequelize.query(`
        UPDATE "VocabularyMatchingExercises" 
        SET category = c.name
        FROM "TrailSteps" ts
        JOIN "Categories" c ON ts."categoryId" = c.id
        WHERE "VocabularyMatchingExercises"."trailStepId" = ts.id
      `, { transaction });
      
      // Step 4: Recreate the index on category column
      await queryInterface.addIndex('VocabularyMatchingExercises', ['category'], {
        name: 'vocabulary_matching_exercises_category',
        transaction
      });
      
      await transaction.commit();
      console.log('VocabularyMatchingExercises table rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error rolling back VocabularyMatchingExercises changes:', error);
      throw error;
    }
  }
};