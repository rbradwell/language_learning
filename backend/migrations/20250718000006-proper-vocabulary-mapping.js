'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Implementing proper vocabulary mapping strategy...');

      // Step 1: Create map from all Vocabularies - key is targetWord, value is id
      const vocabularies = await queryInterface.sequelize.query(
        `SELECT id, "targetWord" FROM "Vocabularies"`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      const vocabMap = {};
      vocabularies.forEach(vocab => {
        vocabMap[vocab.targetWord] = vocab.id;
      });

      console.log(`Created vocabulary map with ${Object.keys(vocabMap).length} entries`);

      // Step 2: Get all sentences
      const sentences = await queryInterface.sequelize.query(
        `SELECT id, "targetText" FROM "Sentences"`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Processing ${sentences.length} sentences...`);

      let processedCount = 0;

      // Step 3: For each sentence, find vocabulary IDs by matching leftmost unmatched parts
      for (const sentence of sentences) {
        const targetText = sentence.targetText;
        const vocabularyIds = [];
        let position = 0;

        console.log(`\nProcessing: "${targetText}"`);

        // Continue until we've processed the entire target text
        while (position < targetText.length) {
          let matched = false;
          
          // Try to find the longest vocabulary word that matches from current position
          // Start with longer words first for better matching
          for (let endPos = targetText.length; endPos > position; endPos--) {
            const substring = targetText.substring(position, endPos);
            
            if (vocabMap[substring]) {
              vocabularyIds.push(vocabMap[substring]);
              console.log(`  ✓ Matched "${substring}" -> ${vocabMap[substring]}`);
              position = endPos;
              matched = true;
              break;
            }
          }

          // If no vocabulary word matched, skip this character
          if (!matched) {
            const skippedChar = targetText[position];
            console.log(`  ✗ Skipped "${skippedChar}" (no vocabulary match)`);
            position++;
          }
        }

        // Update the sentence with the found vocabulary IDs
        if (vocabularyIds.length > 0) {
          await queryInterface.sequelize.query(
            `UPDATE "Sentences" 
             SET "vocabularyIds" = :vocabularyIds, "sentenceLength" = :sentenceLength
             WHERE id = :id`,
            {
              replacements: {
                id: sentence.id,
                vocabularyIds: JSON.stringify(vocabularyIds),
                sentenceLength: vocabularyIds.length
              },
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              transaction
            }
          );

          console.log(`  → Updated with ${vocabularyIds.length} vocabulary IDs`);
          processedCount++;
        } else {
          console.log(`  → No vocabulary matches found for "${targetText}"`);
        }
      }

      await transaction.commit();
      console.log(`\nCompleted! Successfully processed ${processedCount} sentences`);
      
    } catch (error) {
      await transaction.rollback();
      console.error('Vocabulary mapping failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Reset all vocabularyIds to empty arrays
      await queryInterface.sequelize.query(
        `UPDATE "Sentences" SET "vocabularyIds" = '[]'`,
        { transaction }
      );
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};