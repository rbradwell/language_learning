#!/usr/bin/env node

const { TrailStep, Category } = require('./models');

(async () => {
  try {
    console.log('=== CURRENT TRAIL STEP ORDER BY CATEGORY ===\n');
    
    // Get all trail steps grouped by category
    const trailSteps = await TrailStep.findAll({
      include: [{
        model: Category,
        as: 'category',
        attributes: ['name', 'language', 'difficulty']
      }],
      order: [
        [{ model: Category, as: 'category' }, 'difficulty', 'ASC'],
        [{ model: Category, as: 'category' }, 'name', 'ASC'],
        ['stepNumber', 'ASC']
      ]
    });

    // Group by category
    const byCategory = {};
    trailSteps.forEach(step => {
      const catName = step.category.name;
      if (!byCategory[catName]) {
        byCategory[catName] = [];
      }
      byCategory[catName].push(step);
    });

    // Display each category's trail steps
    Object.keys(byCategory).forEach(categoryName => {
      const steps = byCategory[categoryName];
      const firstStep = steps[0];
      
      console.log(`📚 ${categoryName} (${firstStep.category.language}, Difficulty: ${firstStep.category.difficulty})`);
      
      steps.forEach((step, i) => {
        const icon = step.type === 'vocabulary_matching' ? '🔤' : 
                    step.type === 'vocabulary_matching_reverse' ? '🔄' :
                    step.type === 'sentence_completion' ? '📝' :
                    step.type === 'fill_blanks' ? '📋' : '❓';
        
        console.log(`  ${step.stepNumber}. ${icon} ${step.name} (${step.type})`);
      });
      console.log('');
    });

    // Count by type
    const typeCounts = {};
    trailSteps.forEach(step => {
      typeCounts[step.type] = (typeCounts[step.type] || 0) + 1;
    });

    console.log('=== EXERCISE TYPE SUMMARY ===');
    Object.keys(typeCounts).forEach(type => {
      const icon = type === 'vocabulary_matching' ? '🔤' : 
                  type === 'vocabulary_matching_reverse' ? '🔄' :
                  type === 'sentence_completion' ? '📝' :
                  type === 'fill_blanks' ? '📋' : '❓';
      console.log(`${icon} ${type}: ${typeCounts[type]} steps`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();