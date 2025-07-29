#!/usr/bin/env node

const { VocabularyMatchingExercises, TrailStep, Category } = require('./models');

(async () => {
  try {
    console.log('=== CHECKING VOCABULARY MATCHING EXERCISES ===\n');
    
    // Get all exercises with trail step info
    const exercises = await VocabularyMatchingExercises.findAll({
      include: [{
        model: TrailStep,
        as: 'trailStep',
        include: [{ model: Category, as: 'category' }]
      }],
      order: [['trailStepId', 'ASC']]
    });
    
    console.log(`Total VocabularyMatchingExercises: ${exercises.length}\n`);
    
    // Group by trail step
    const groupedByStep = {};
    exercises.forEach(ex => {
      const stepId = ex.trailStepId;
      if (!groupedByStep[stepId]) {
        groupedByStep[stepId] = [];
      }
      groupedByStep[stepId].push(ex);
    });
    
    console.log('=== EXERCISES BY TRAIL STEP ===');
    let multipleCount = 0;
    
    Object.keys(groupedByStep).forEach(stepId => {
      const exs = groupedByStep[stepId];
      const step = exs[0].trailStep;
      
      if (exs.length > 1) {
        multipleCount++;
        console.log(`🔴 Trail Step: ${step.name} (Category: ${step.category?.name || 'Unknown'})`);
      } else {
        console.log(`✅ Trail Step: ${step.name} (Category: ${step.category?.name || 'Unknown'})`);
      }
      
      console.log(`   Trail Step ID: ${stepId}`);
      console.log(`   Exercise Count: ${exs.length}`);
      
      exs.forEach((ex, i) => {
        const vocabularyCount = Array.isArray(ex.vocabularyIds) ? ex.vocabularyIds.length : 0;
        console.log(`     Exercise ${i+1}: ${ex.id} (${vocabularyCount} vocabulary items)`);
        if (ex.order !== undefined) {
          console.log(`       Order: ${ex.order}`);
        }
        if (ex.category !== undefined) {
          console.log(`       Category: ${ex.category}`);
        }
      });
      console.log('');
    });
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Trail steps with multiple exercises: ${multipleCount}`);
    console.log(`Total trail steps: ${Object.keys(groupedByStep).length}`);
    
    // Check if order and category columns exist
    const [results] = await VocabularyMatchingExercises.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'VocabularyMatchingExercises' 
      AND column_name IN ('order', 'category')
      ORDER BY column_name
    `);
    
    console.log(`\nColumns that should be removed: ${results.map(r => r.column_name).join(', ') || 'None'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();