'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back vocabulary mapping changes...');

      // Re-add the wordPositions column
      await queryInterface.addColumn('Sentences', 'wordPositions', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: '[]',
        comment: 'Array mapping each word position to vocabulary ID'
      }, { transaction });

      // Reset all vocabularyIds to empty arrays since the previous migration was flawed
      await queryInterface.sequelize.query(
        `UPDATE "Sentences" SET "vocabularyIds" = '[]', "wordPositions" = '[]'`,
        { transaction }
      );

      await transaction.commit();
      console.log('Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.removeColumn('Sentences', 'wordPositions', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};