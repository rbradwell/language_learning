#!/usr/bin/env node

const { TrailStep, Category } = require('./models');

(async () => {
  try {
    console.log('=== DEBUGGING TRAIL STEP ORDER ===\n');
    
    // Get all trail steps for a specific category to see the order
    const categories = await Category.findAll({
      where: { language: 'Mandarin' },
      include: [{
        model: TrailStep,
        as: 'trailSteps',
        order: [['stepNumber', 'ASC']]
      }],
      order: [['difficulty', 'ASC'], ['name', 'ASC']],
      limit: 3 // Just check first 3 categories
    });

    categories.forEach(category => {
      console.log(`📚 ${category.name} (Difficulty: ${category.difficulty})`);
      
      category.trailSteps.forEach((step, i) => {
        const icon = step.type === 'vocabulary_matching' ? '🔤' : 
                    step.type === 'vocabulary_matching_reverse' ? '🔄' :
                    step.type === 'sentence_completion' ? '📝' :
                    step.type === 'fill_blanks' ? '📋' : '❓';
        
        console.log(`  ${step.stepNumber}. ${icon} ${step.name} (${step.type})`);
      });
      console.log('');
    });

    // Check specifically what happens after vocabulary_matching step 1
    console.log('=== CHECKING STEP SEQUENCE AFTER VOCABULARY MATCHING ===');
    
    const firstCategory = categories[0];
    if (firstCategory) {
      const vocabStep = firstCategory.trailSteps.find(s => s.type === 'vocabulary_matching');
      const nextStep = firstCategory.trailSteps.find(s => s.stepNumber === vocabStep.stepNumber + 1);
      
      console.log(`After "${vocabStep.name}" (Step ${vocabStep.stepNumber})`);
      console.log(`Next step is: "${nextStep?.name}" (Step ${nextStep?.stepNumber}, Type: ${nextStep?.type})`);
      
      if (nextStep?.type !== 'vocabulary_matching_reverse') {
        console.log('❌ PROBLEM: Next step is not vocabulary_matching_reverse!');
        console.log('The reverse step needs to be inserted at step', vocabStep.stepNumber + 1);
      } else {
        console.log('✅ Correct: Next step is vocabulary_matching_reverse');
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();