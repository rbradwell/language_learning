#!/usr/bin/env node

const { TrailStep, Category, VocabularyMatchingExercises } = require('./models');

(async () => {
  try {
    console.log('=== CURRENT VOCABULARY MATCHING TRAIL STEPS ===\n');
    
    const trailSteps = await TrailStep.findAll({
      where: { type: 'vocabulary_matching' },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'language', 'difficulty']
        },
        {
          model: VocabularyMatchingExercises,
          required: false,
          attributes: ['id', 'vocabularyIds']
        }
      ],
      order: [
        [{ model: Category, as: 'category' }, 'difficulty', 'ASC'],
        [{ model: Category, as: 'category' }, 'name', 'ASC'],
        ['stepNumber', 'ASC']
      ]
    });
    
    console.log(`Found ${trailSteps.length} vocabulary matching trail steps:\n`);
    
    trailSteps.forEach((step, i) => {
      const hasExercise = step.VocabularyMatchingExercises && step.VocabularyMatchingExercises.length > 0;
      const vocabCount = hasExercise ? 
        (Array.isArray(step.VocabularyMatchingExercises[0].vocabularyIds) ? 
         step.VocabularyMatchingExercises[0].vocabularyIds.length : 
         JSON.parse(step.VocabularyMatchingExercises[0].vocabularyIds || '[]').length) : 0;
      
      console.log(`${i + 1}. ${step.name}`);
      console.log(`   Category: ${step.category.name} (${step.category.language})`);
      console.log(`   Step Number: ${step.stepNumber}`);
      console.log(`   Difficulty: ${step.category.difficulty}`);
      console.log(`   Exercise: ${hasExercise ? `✅ (${vocabCount} vocabulary items)` : '❌ Missing'}`);
      console.log(`   Trail Step ID: ${step.id}`);
      console.log('');
    });
    
    console.log('=== SUMMARY BY CATEGORY ===');
    const byCategory = {};
    trailSteps.forEach(step => {
      const catName = step.category.name;
      if (!byCategory[catName]) byCategory[catName] = [];
      byCategory[catName].push(step);
    });
    
    Object.keys(byCategory).forEach(catName => {
      const steps = byCategory[catName];
      console.log(`${catName}: ${steps.length} step(s)`);
      steps.forEach(step => {
        console.log(`  - Step ${step.stepNumber}: ${step.name}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();