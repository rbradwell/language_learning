#!/usr/bin/env node

const { TrailStep, Category, VocabularyMatchingExercises, sequelize } = require('./models');
const { v4: uuidv4 } = require('uuid');

(async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('=== CREATING REVERSE VOCABULARY MATCHING STEPS ===\n');
    
    // First, update the enum type to include the new value
    console.log('1. Adding vocabulary_matching_reverse to enum...');
    try {
      await sequelize.query(`ALTER TYPE "enum_TrailSteps_type" ADD VALUE 'vocabulary_matching_reverse';`, { transaction });
      console.log('✅ Enum updated successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Enum value already exists');
      } else {
        throw error;
      }
    }

    // Get all existing vocabulary_matching trail steps
    console.log('\n2. Finding existing vocabulary matching steps...');
    const vocabSteps = await TrailStep.findAll({
      where: { type: 'vocabulary_matching' },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'language', 'difficulty']
      }],
      order: [
        [{ model: Category, as: 'category' }, 'difficulty', 'ASC'],
        [{ model: Category, as: 'category' }, 'name', 'ASC'],
        ['stepNumber', 'ASC']
      ],
      transaction
    });

    console.log(`Found ${vocabSteps.length} existing vocabulary matching steps`);

    // Get the highest step number for each category
    const maxStepNumbers = await sequelize.query(`
      SELECT "categoryId", MAX("stepNumber") as "maxStepNumber"
      FROM "TrailSteps"
      GROUP BY "categoryId"
    `, { type: sequelize.QueryTypes.SELECT, transaction });

    const maxStepByCategory = {};
    maxStepNumbers.forEach(row => {
      maxStepByCategory[row.categoryId] = row.maxStepNumber;
    });

    console.log('\n3. Creating reverse trail steps...');
    let createdSteps = 0;
    let createdExercises = 0;

    for (const step of vocabSteps) {
      // Check if reverse step already exists
      const existingReverse = await TrailStep.findOne({
        where: {
          categoryId: step.categoryId,
          type: 'vocabulary_matching_reverse',
          name: step.name.replace('Vocabulary Matching', 'Chinese Recognition')
        },
        transaction
      });

      if (existingReverse) {
        console.log(`⏭️  Reverse step already exists for: ${step.category.name} - ${step.name}`);
        continue;
      }

      // Create target_to_native trail step
      const newStepNumber = maxStepByCategory[step.categoryId] + 1;
      maxStepByCategory[step.categoryId] = newStepNumber;
      
      const newStepId = uuidv4();
      const newStep = await TrailStep.create({
        id: newStepId,
        categoryId: step.categoryId,
        name: step.name.replace('Vocabulary Matching', 'Chinese Recognition'),
        type: 'vocabulary_matching_reverse',
        stepNumber: newStepNumber,
        passingScore: step.passingScore,
        timeLimit: step.timeLimit
      }, { transaction });

      createdSteps++;

      // Get the vocabulary IDs from the original exercise
      const originalExercises = await VocabularyMatchingExercises.findAll({
        where: { trailStepId: step.id },
        transaction
      });

      if (originalExercises.length > 0) {
        // Create matching exercise for the new step
        await VocabularyMatchingExercises.create({
          id: uuidv4(),
          trailStepId: newStepId,
          vocabularyIds: originalExercises[0].vocabularyIds,
          instructions: 'Select the English translation for each Chinese word'
        }, { transaction });

        createdExercises++;
      }

      console.log(`✅ Created reverse step: ${step.category.name} - ${newStep.name} (Step ${newStepNumber})`);
    }

    await transaction.commit();
    
    console.log(`\n🎉 SUCCESS! Created ${createdSteps} new reverse trail steps and ${createdExercises} exercises`);
    
    // Show summary
    console.log('\n=== SUMMARY ===');
    const allReverseSteps = await TrailStep.findAll({
      where: { type: 'vocabulary_matching_reverse' },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name']
      }],
      order: [['stepNumber', 'ASC']]
    });

    console.log(`Total reverse steps now: ${allReverseSteps.length}`);
    allReverseSteps.slice(0, 5).forEach((step, i) => {
      console.log(`${i + 1}. ${step.name} (${step.category.name}) - Step ${step.stepNumber}`);
    });
    if (allReverseSteps.length > 5) {
      console.log(`... and ${allReverseSteps.length - 5} more`);
    }

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating reverse steps:', error.message);
    console.error(error);
    process.exit(1);
  }
})();