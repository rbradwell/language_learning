'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Simple fix: ensuring all sentences have vocabulary IDs...');

      // Get all sentences that have empty vocabularyIds
      const sentences = await queryInterface.sequelize.query(
        `SELECT s.id, s."categoryId", s."targetText" FROM "Sentences" s 
         WHERE s."vocabularyIds"::text = '[]' OR s."vocabularyIds" IS NULL`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Found ${sentences.length} sentences with empty vocabulary IDs`);

      // For each sentence, get some vocabulary from its category
      for (const sentence of sentences) {
        const categoryVocabs = await queryInterface.sequelize.query(
          `SELECT id FROM "Vocabularies" WHERE "categoryId" = :categoryId LIMIT 5`,
          { 
            replacements: { categoryId: sentence.categoryId },
            type: queryInterface.sequelize.QueryTypes.SELECT, 
            transaction 
          }
        );

        if (categoryVocabs.length > 0) {
          const vocabIds = categoryVocabs.map(v => v.id);
          
          await queryInterface.sequelize.query(
            `UPDATE "Sentences" SET "vocabularyIds" = :vocabularyIds WHERE id = :id`,
            {
              replacements: {
                id: sentence.id,
                vocabularyIds: JSON.stringify(vocabIds)
              },
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              transaction
            }
          );
          
          console.log(`Fixed sentence: "${sentence.targetText}" -> ${vocabIds.length} vocab IDs`);
        }
      }

      await transaction.commit();
      console.log('Simple vocabulary fix completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Simple fix failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // No rollback needed - this just fixes empty vocabulary arrays
  }
};