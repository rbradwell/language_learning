#!/usr/bin/env node

const { TrailStep, Category, VocabularyMatchingExercises } = require('./models');

(async () => {
  try {
    console.log('=== TESTING REVERSE EXERCISE SETUP ===\n');
    
    // Check if we have any reverse trail steps
    const reverseSteps = await TrailStep.findAll({
      where: { type: 'vocabulary_matching_reverse' },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'language']
        },
        {
          model: VocabularyMatchingExercises,
          required: false
        }
      ],
      order: [['stepNumber', 'ASC']]
    });

    console.log(`Found ${reverseSteps.length} reverse vocabulary matching steps:\n`);

    if (reverseSteps.length === 0) {
      console.log('❌ No reverse steps found. Need to run migration first.');
    } else {
      reverseSteps.forEach((step, i) => {
        const hasExercise = step.VocabularyMatchingExercises && step.VocabularyMatchingExercises.length > 0;
        console.log(`${i + 1}. ${step.name}`);
        console.log(`   Category: ${step.category.name}`);
        console.log(`   Step Number: ${step.stepNumber}`);
        console.log(`   Exercise: ${hasExercise ? '✅' : '❌'}`);
        console.log('');
      });
    }

    // Also check regular vocabulary matching steps for comparison
    const regularSteps = await TrailStep.findAll({
      where: { type: 'vocabulary_matching' },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      order: [['stepNumber', 'ASC']],
      limit: 3
    });

    console.log(`\\nFor comparison, found ${regularSteps.length} regular vocabulary matching steps (showing first 3):`);
    regularSteps.forEach((step, i) => {
      console.log(`${i + 1}. ${step.name} (${step.category.name})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();