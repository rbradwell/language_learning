'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Starting sentences vocabulary mapping fix...');

      // Step 1: Get all sentences with their current vocabulary mappings
      const sentences = await queryInterface.sequelize.query(
        `SELECT s.id, s."categoryId", s."targetText", s."vocabularyIds", s."wordPositions" 
         FROM "Sentences" s`,
        { 
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction 
        }
      );

      console.log(`Found ${sentences.length} sentences to process`);

      // Step 2: Get all available vocabulary for each category
      const vocabularies = await queryInterface.sequelize.query(
        `SELECT v.id, v."categoryId", v."targetWord", v."nativeWord" 
         FROM "Vocabularies" v 
         ORDER BY v."categoryId", v."targetWord"`,
        { 
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction 
        }
      );

      // Group vocabularies by category for efficient lookup
      const vocabByCategory = {};
      vocabularies.forEach(vocab => {
        if (!vocabByCategory[vocab.categoryId]) {
          vocabByCategory[vocab.categoryId] = [];
        }
        vocabByCategory[vocab.categoryId].push(vocab);
      });

      console.log(`Loaded vocabulary for ${Object.keys(vocabByCategory).length} categories`);

      // Step 3: Fix vocabulary mapping for each sentence
      const updates = [];
      let fixedCount = 0;
      let skippedCount = 0;

      for (const sentence of sentences) {
        const categoryVocabs = vocabByCategory[sentence.categoryId] || [];
        
        if (categoryVocabs.length === 0) {
          console.log(`No vocabulary found for category ${sentence.categoryId}, skipping sentence ${sentence.id}`);
          skippedCount++;
          continue;
        }

        // Parse target text into words (split by common Chinese punctuation and spaces)
        const words = sentence.targetText
          .split(/([。？！，、；：""''（）【】〔〕\s]+)/)
          .filter(word => word && word.trim() && !/^[。？！，、；：""''（）【】〔〕\s]+$/.test(word));

        console.log(`Processing sentence: "${sentence.targetText}"`);
        console.log(`Words found: [${words.join(', ')}]`);

        // Map words to vocabulary IDs using multiple matching strategies
        const newVocabularyIds = [];
        const unmatchedWords = [];

        for (const word of words) {
          let matchedVocab = null;

          // Strategy 1: Exact match
          matchedVocab = categoryVocabs.find(v => v.targetWord === word);

          // Strategy 2: Find vocabulary that contains this word (for compound words)
          if (!matchedVocab) {
            matchedVocab = categoryVocabs.find(v => v.targetWord.includes(word) || word.includes(v.targetWord));
          }

          // Strategy 3: Fuzzy match for similar words (remove common suffixes/prefixes)
          if (!matchedVocab) {
            const normalizedWord = word.replace(/^(一|个|些|的|了|着|过)$/, '').replace(/(的|了|着|过)$/, '');
            if (normalizedWord && normalizedWord !== word) {
              matchedVocab = categoryVocabs.find(v => v.targetWord === normalizedWord);
            }
          }

          if (matchedVocab) {
            newVocabularyIds.push(matchedVocab.id);
            console.log(`  ✓ "${word}" -> vocabulary: "${matchedVocab.targetWord}" (${matchedVocab.id})`);
          } else {
            unmatchedWords.push(word);
            console.log(`  ✗ "${word}" -> no vocabulary match found`);
          }
        }

        // Only update if we found at least some vocabulary matches
        if (newVocabularyIds.length > 0) {
          updates.push({
            id: sentence.id,
            vocabularyIds: JSON.stringify(newVocabularyIds),
            sentenceLength: words.length
          });
          fixedCount++;
          
          if (unmatchedWords.length > 0) {
            console.log(`  Warning: ${unmatchedWords.length} unmatched words: [${unmatchedWords.join(', ')}]`);
          }
        } else {
          console.log(`  No vocabulary matches found for sentence "${sentence.targetText}"`);
          skippedCount++;
        }
      }

      console.log(`Prepared ${updates.length} sentence updates`);

      // Step 4: Apply updates in batches
      const BATCH_SIZE = 50;
      for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        
        for (const update of batch) {
          await queryInterface.sequelize.query(
            `UPDATE "Sentences" 
             SET "vocabularyIds" = :vocabularyIds, "sentenceLength" = :sentenceLength, "updatedAt" = NOW()
             WHERE id = :id`,
            {
              replacements: {
                id: update.id,
                vocabularyIds: update.vocabularyIds,
                sentenceLength: update.sentenceLength
              },
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              transaction
            }
          );
        }
        
        console.log(`Updated batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(updates.length / BATCH_SIZE)}`);
      }

      // Step 5: Remove the redundant wordPositions column
      console.log('Removing redundant wordPositions column...');
      await queryInterface.removeColumn('Sentences', 'wordPositions', { transaction });

      await transaction.commit();
      
      console.log(`Migration completed successfully!`);
      console.log(`- Fixed: ${fixedCount} sentences`);
      console.log(`- Skipped: ${skippedCount} sentences`);
      console.log(`- Removed wordPositions column`);
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Rolling back sentences vocabulary mapping fix...');

      // Step 1: Re-add the wordPositions column
      await queryInterface.addColumn('Sentences', 'wordPositions', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: '[]',
        comment: 'Array mapping each word position to vocabulary ID'
      }, { transaction });

      // Step 2: Rebuild wordPositions from vocabularyIds
      const sentences = await queryInterface.sequelize.query(
        `SELECT id, "vocabularyIds" FROM "Sentences"`,
        { 
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction 
        }
      );

      for (const sentence of sentences) {
        const vocabularyIds = JSON.parse(sentence.vocabularyIds || '[]');
        const wordPositions = vocabularyIds.map((vocabId, index) => ({
          position: index,
          vocabularyId: vocabId
        }));

        await queryInterface.sequelize.query(
          `UPDATE "Sentences" SET "wordPositions" = :wordPositions WHERE id = :id`,
          {
            replacements: {
              id: sentence.id,
              wordPositions: JSON.stringify(wordPositions)
            },
            type: queryInterface.sequelize.QueryTypes.UPDATE,
            transaction
          }
        );
      }

      await transaction.commit();
      console.log('Rollback completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Rollback failed:', error);
      throw error;
    }
  }
};