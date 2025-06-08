// controllers/exerciseController.js
const { Exercise, TrailStep, Trail, Category, Vocabulary, User, UserProgress, UserAnswer } = require('../models');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

const getExercisesByTrailStep = async (req, res) => {
  try {
    const { trailStepId } = req.params;
    const userId = req.userId;

    // Get the trail step and verify access
    const trailStep = await TrailStep.findByPk(trailStepId, {
      include: [{
        model: Trail,
        include: [Category]
      }]
    });

    if (!trailStep) {
      return res.status(404).json({ message: 'Trail step not found' });
    }

    // Check if user has access to this step (implement unlock logic)
    const userProgress = await UserProgress.findAll({
      where: { userId },
      include: [{
        model: TrailStep,
        as: 'trailStep',  // Use the alias from UserProgress model
        where: {
          trailId: trailStep.trailId,
          stepNumber: { [Op.lt]: trailStep.stepNumber }
        }
      }]
    });

    // Check if previous steps are completed (except for step 1)
    if (trailStep.stepNumber > 1) {
      const requiredCompletedSteps = trailStep.stepNumber - 1;
      const completedSteps = userProgress.filter(p => p.completed).length;
      
      if (completedSteps < requiredCompletedSteps) {
        return res.status(403).json({ 
          message: 'You must complete previous steps before accessing this one.',
          requiredSteps: requiredCompletedSteps,
          completedSteps: completedSteps
        });
      }
    }

    let exercises = [];

    if (trailStep.type === 'vocabulary_matching') {
      // Get vocabulary for this category
      const vocabulary = await Vocabulary.findAll({
        where: { categoryId: trailStep.Trail.categoryId },
        limit: 8, // Optimal number for matching exercise
        order: sequelize.random() // Random selection
      });

      exercises = [{
        type: 'vocabulary_matching',
        vocabulary: vocabulary,
        timeLimit: trailStep.timeLimit,
        passingScore: trailStep.passingScore
      }];
    } else {
      // Get stored exercises for sentence completion and fill blanks
      exercises = await Exercise.findAll({
        where: { trailStepId },
        order: [['order', 'ASC']]
      });

      // Parse JSON content
      exercises = exercises.map(ex => ({
        ...ex.toJSON(),
        content: JSON.parse(ex.content)
      }));
    }

    res.json({
      trailStep: {
        id: trailStep.id,
        name: trailStep.name,
        type: trailStep.type,
        stepNumber: trailStep.stepNumber,
        passingScore: trailStep.passingScore,
        timeLimit: trailStep.timeLimit,
        category: trailStep.Trail.Category.name
      },
      exercises
    });

  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const submitExerciseResults = async (req, res) => {
  try {
    const { trailStepId, score, answers, timeSpent } = req.body;
    const userId = req.userId;

    // Validate input
    if (!trailStepId || score === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const trailStep = await TrailStep.findByPk(trailStepId);
    if (!trailStep) {
      return res.status(404).json({ message: 'Trail step not found' });
    }

    // Calculate if user passed
    const passed = score >= trailStep.passingScore;

    // Save user progress
    const [userProgress, created] = await UserProgress.findOrCreate({
      where: {
        userId,
        trailStepId
      },
      defaults: {
        score,
        timeSpent,
        completed: passed,
        attempts: 1
      }
    });

    if (!created) {
      // Update existing progress
      userProgress.score = Math.max(userProgress.score, score); // Keep best score
      userProgress.attempts += 1;
      userProgress.completed = userProgress.completed || passed;
      userProgress.timeSpent = Math.min(userProgress.timeSpent || Infinity, timeSpent);
      await userProgress.save();
    }

    // Save individual answers for learning analytics
    if (answers && Array.isArray(answers)) {
      const answerPromises = answers.map(answer => {
        return UserAnswer.create({
          userId,
          vocabularyId: answer.vocabularyId || null,
          exerciseId: answer.exerciseId || null,
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect,
          timeSpent: answer.timeSpent || 0
        });
      });
      
      await Promise.all(answerPromises);
    }

    // Update user's total score if they passed and it's their first completion
    if (passed && (created || !userProgress.completed)) {
      const user = await User.findByPk(userId);
      user.totalScore += Math.floor(score * 0.1); // Award points based on score
      await user.save();
    }

    // Check if next step should be unlocked
    let nextStepUnlocked = false;
    let nextStep = null;
    if (passed) {
      nextStep = await TrailStep.findOne({
        where: {
          trailId: trailStep.trailId,
          stepNumber: trailStep.stepNumber + 1
        }
      });
      
      if (nextStep) {
        nextStepUnlocked = true;
      }
    }

    res.json({
      success: true,
      passed,
      score,
      bestScore: userProgress.score,
      attempts: userProgress.attempts,
      nextStepUnlocked,
      nextStep: nextStep ? {
        id: nextStep.id,
        name: nextStep.name,
        stepNumber: nextStep.stepNumber
      } : null,
      message: passed ? 'Congratulations! You passed this step.' : `You need ${trailStep.passingScore}% to pass. Keep practicing!`
    });

  } catch (error) {
    console.error('Error submitting exercise results:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { categoryId } = req.params;

    const whereClause = { userId };
    const includeClause = [{
      model: TrailStep,
      as: 'trailStep',  // Use the alias from UserProgress model
      include: [{
        model: Trail,
        include: [Category]
      }]
    }];

    if (categoryId) {
      includeClause[0].include[0].where = { categoryId };
    }

    const progress = await UserProgress.findAll({
      where: whereClause,
      include: includeClause,
      order: [[{ model: TrailStep, as: 'trailStep' }, 'stepNumber', 'ASC']]
    });

    // Group progress by trail
    const progressByTrail = {};
    progress.forEach(p => {
      const trailId = p.trailStep.Trail.id;
      if (!progressByTrail[trailId]) {
        progressByTrail[trailId] = {
          trail: {
            id: p.trailStep.Trail.id,
            name: p.trailStep.Trail.name,
            category: p.trailStep.Trail.Category
          },
          steps: [],
          overallProgress: 0
        };
      }
      progressByTrail[trailId].steps.push({
        stepId: p.trailStep.id,
        stepNumber: p.trailStep.stepNumber,
        stepName: p.trailStep.name,
        stepType: p.trailStep.type,
        completed: p.completed,
        score: p.score,
        attempts: p.attempts,
        timeSpent: p.timeSpent,
        passingScore: p.trailStep.passingScore
      });
    });

    // Calculate overall progress for each trail
    Object.values(progressByTrail).forEach(trail => {
      const completedSteps = trail.steps.filter(step => step.completed).length;
      trail.overallProgress = Math.round((completedSteps / trail.steps.length) * 100);
    });

    res.json({ progress: Object.values(progressByTrail) });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getWeakVocabulary = async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20 } = req.query;

    // Find vocabulary that user struggles with most
    const weakVocabulary = await UserAnswer.findAll({
      where: { userId },
      include: [{
        model: Vocabulary,
        required: true
      }],
      attributes: [
        'vocabularyId',
        [sequelize.fn('COUNT', sequelize.col('UserAnswer.id')), 'totalAttempts'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.col('isCorrect'), 'INTEGER')), 'correctAttempts'],
        [sequelize.literal('(COUNT(*) - SUM(CAST("isCorrect" AS INTEGER))) / COUNT(*)::float'), 'errorRate']
      ],
      group: ['vocabularyId', 'Vocabulary.id'],
      having: sequelize.literal('COUNT(*) >= 3'), // At least 3 attempts
      order: [[sequelize.literal('errorRate'), 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ weakVocabulary });

  } catch (error) {
    console.error('Error fetching weak vocabulary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getExercisesByTrailStep,
  submitExerciseResults,
  getUserProgress,
  getWeakVocabulary
};