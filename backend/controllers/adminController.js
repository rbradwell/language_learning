// controllers/adminController.js
const { validationResult } = require('express-validator');
const { 
  Category, 
  Trail, 
  TrailStep, 
  Exercise, 
  ExerciseSession,
  Vocabulary,
  VocabularyMatchingExercises
} = require('../models');
const { Op } = require('sequelize');

/**
 * Bulk create vocabulary exercises from existing vocabulary data
 * Automatically creates exercises for trail steps that need them
 */
const bulkCreateVocabularyExercises = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { 
      wordsPerExercise = 10, 
      categoryId, 
      dryRun = false 
    } = req.body;

    // Step 1: Get vocabulary to create exercises from
    let vocabularyWhere = {};
    if (categoryId) {
      vocabularyWhere.categoryId = categoryId;
    }

    const vocabulary = await Vocabulary.findAll({
      where: vocabularyWhere,
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'language']
        }
      ],
      order: [['difficulty', 'ASC'], ['id', 'ASC']]
    });

    if (vocabulary.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No vocabulary found with specified criteria'
      });
    }

    // Step 2: Get trail steps that need vocabulary exercises
    // Find trail steps of type 'vocabulary_matching' that don't have exercises yet
    const trailStepsNeedingExercises = await TrailStep.findAll({
      where: {
        type: 'vocabulary_matching'
      },
      include: [
        {
          model: Trail,
          include: [
            {
              model: Category,
              where: categoryId ? { id: categoryId } : {},
              attributes: ['id', 'name', 'language']
            }
          ]
        },
        {
          model: VocabularyMatchingExercises,
          required: false, // Left join to find trail steps WITHOUT vocabulary matching exercises
          attributes: ['id']
        }
      ]
    });

    // Filter to only trail steps that have no vocabulary matching exercises
    const trailStepsWithoutExercises = trailStepsNeedingExercises.filter(step => 
      step.VocabularyMatchingExercises.length === 0
    );

    if (trailStepsWithoutExercises.length === 0) {
      return res.json({
        success: true,
        message: 'All vocabulary trail steps already have exercises',
        data: {
          totalTrailSteps: trailStepsNeedingExercises.length,
          trailStepsAlreadyHaveExercises: trailStepsNeedingExercises.length
        }
      });
    }

    // Step 3: Group vocabulary by category for distribution
    const vocabularyByCategory = vocabulary.reduce((acc, vocab) => {
      const categoryId = vocab.Category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(vocab);
      return acc;
    }, {});

    // Step 4: Create exercises for each trail step
    const exerciseCreationPlan = [];
    
    for (const trailStep of trailStepsWithoutExercises) {
      const categoryId = trailStep.Trail.Category.id;
      const categoryVocabulary = vocabularyByCategory[categoryId] || [];
      
      if (categoryVocabulary.length === 0) {
        console.log(`No vocabulary found for category ${trailStep.Trail.Category.name}`);
        continue;
      }

      // Group vocabulary into exercises for this trail step
      const exerciseGroups = [];
      for (let i = 0; i < categoryVocabulary.length; i += wordsPerExercise) {
        exerciseGroups.push(categoryVocabulary.slice(i, i + wordsPerExercise));
      }

      exerciseCreationPlan.push({
        trailStep: {
          id: trailStep.id,
          name: trailStep.name,
          stepNumber: trailStep.stepNumber,
          trail: trailStep.Trail.name,
          category: trailStep.Trail.Category.name
        },
        exerciseGroups,
        exercisesToCreate: exerciseGroups.length
      });
    }

    if (dryRun) {
      return res.json({
        success: true,
        message: 'Dry run completed',
        data: {
          totalVocabulary: vocabulary.length,
          trailStepsToProcess: exerciseCreationPlan.length,
          totalExercisesWouldCreate: exerciseCreationPlan.reduce((sum, plan) => 
            sum + plan.exercisesToCreate, 0
          ),
          wordsPerExercise,
          plan: exerciseCreationPlan.map(plan => ({
            trailStep: plan.trailStep,
            exercisesToCreate: plan.exercisesToCreate,
            vocabularyCount: plan.exerciseGroups.reduce((sum, group) => sum + group.length, 0)
          }))
        }
      });
    }

    // Step 5: Actually create the exercises
    const createdExercises = [];
    
    for (const plan of exerciseCreationPlan) {
      for (let i = 0; i < plan.exerciseGroups.length; i++) {
        const group = plan.exerciseGroups[i];
        const exercise = await VocabularyMatchingExercises.create({
          trailStepId: plan.trailStep.id,
          vocabularyIds: group.map(v => v.id),
          instructions: 'Match the words with their translations',
          category: plan.trailStep.category,
          order: i + 1
        });
        createdExercises.push({
          ...exercise.toJSON(),
          trailStepName: plan.trailStep.name,
          categoryName: plan.trailStep.category
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdExercises.length} vocabulary exercises across ${exerciseCreationPlan.length} trail steps`,
      data: {
        exercisesCreated: createdExercises.length,
        trailStepsProcessed: exerciseCreationPlan.length,
        totalVocabulary: vocabulary.length,
        wordsPerExercise,
        summary: exerciseCreationPlan.map(plan => ({
          trailStep: plan.trailStep.name,
          category: plan.trailStep.category,
          exercisesCreated: plan.exercisesToCreate
        })),
        exercises: createdExercises.map(ex => ({
          id: ex.id,
          trailStepName: ex.trailStepName,
          categoryName: ex.categoryName,
          order: ex.order,
          vocabularyCount: ex.vocabularyIds.length
        }))
      }
    });

  } catch (error) {
    console.error('Error bulk creating vocabulary exercises:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk create exercises',
      error: error.message
    });
  }
};

/**
 * Session cleanup endpoint (for cron jobs or manual cleanup)
 */
const runSessionCleanup = async (req, res) => {
  try {
    const expiredCount = await ExerciseSession.update(
      { status: 'abandoned' },
      {
        where: {
          status: 'in_progress',
          expiresAt: { [Op.lt]: new Date() }
        }
      }
    );

    res.json({
      success: true,
      message: `Cleaned up ${expiredCount[0]} expired sessions`
    });

  } catch (error) {
    console.error('Error during session cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup sessions',
      error: error.message
    });
  }
};

module.exports = {
  bulkCreateVocabularyExercises,
  runSessionCleanup
};