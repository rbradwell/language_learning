// controllers/exerciseController.js
const { validationResult } = require('express-validator');
const { 
  Category, 
  Trail, 
  TrailStep, 
  Exercise, 
  ExerciseSession, 
  ExerciseSessionVocabulary,
  UserProgress,
  UserAnswer,
  Vocabulary,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

/**
 * Get comprehensive trail steps progress for user - DEBUG VERSION
 * Shows all categories, trails, exercises with session info and unlock status
 */
const getTrailStepsProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('User ID:', userId);
    console.log('User target language:', req.user.targetLanguage);

    // Step 1: Check if categories exist
    const allCategories = await Category.findAll();
    console.log('All categories in database:', allCategories.length);
    console.log('Categories:', allCategories.map(c => ({ id: c.id, name: c.name, language: c.language })));

    // Step 2: Check categories for user's target language
    const userCategories = await Category.findAll({
      where: {
        language: req.user.targetLanguage
      }
    });
    console.log('Categories for user language:', userCategories.length);

    // Step 3: Check trails
    const allTrails = await Trail.findAll();
    console.log('All trails in database:', allTrails.length);

    // Step 4: Check trail steps
    const allTrailSteps = await TrailStep.findAll();
    console.log('All trail steps in database:', allTrailSteps.length);

    // Step 5: Check exercises
    const allExercises = await Exercise.findAll();
    console.log('All exercises in database:', allExercises.length);

    // Step 6: Try the full query with debug info
    const categories = await Category.findAll({
      where: {
        language: req.user.targetLanguage
      },
      include: [
        {
          model: Trail,
          required: false, // Changed to false for debugging
          include: [
            {
              model: TrailStep,
              required: false, // Changed to false for debugging
              include: [
                {
                  model: Exercise,
                  required: false, // Changed to false for debugging
                  include: [
                    {
                      model: ExerciseSession,
                      as: 'session',
                      where: { userId },
                      required: false,
                      attributes: ['id', 'status', 'score', 'completedAt']
                    }
                  ]
                }
              ],
              order: [['stepNumber', 'ASC']]
            }
          ],
          order: [['order', 'ASC']]
        }
      ],
      order: [['difficulty', 'ASC'], ['name', 'ASC']]
    });

    console.log('Query result - categories with includes:', categories.length);
    
    // Log the structure we get back
    categories.forEach(category => {
      console.log(`Category: ${category.name} (${category.language})`);
      console.log(`  - Trails: ${category.Trails ? category.Trails.length : 'No Trails property'}`);
      
      if (category.Trails) {
        category.Trails.forEach(trail => {
          console.log(`    Trail: ${trail.name}`);
          console.log(`    - TrailSteps: ${trail.TrailSteps ? trail.TrailSteps.length : 'No TrailSteps property'}`);
          
          if (trail.TrailSteps) {
            trail.TrailSteps.forEach(step => {
              console.log(`      Step: ${step.name} (${step.stepNumber})`);
              console.log(`      - Exercises: ${step.Exercises ? step.Exercises.length : 'No Exercises property'}`);
            });
          }
        });
      }
    });

    // Get user's completed trail steps to determine unlocked status
    const userProgress = await UserProgress.findAll({
      where: { 
        userId,
        completed: true 
      },
      include: [
        {
          model: TrailStep,
          as: 'trailStep',
          attributes: ['id', 'trailId', 'stepNumber', 'passingScore']
        }
      ]
    });

    // Create a map of completed trail steps by trail
    const completedStepsByTrail = userProgress.reduce((acc, progress) => {
      const trailId = progress.trailStep.trailId;
      if (!acc[trailId]) acc[trailId] = [];
      acc[trailId].push(progress.trailStep.stepNumber);
      return acc;
    }, {});

    // Return simplified structure for debugging
    const result = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      language: category.language,
      difficulty: category.difficulty,
      trailsCount: category.Trails ? category.Trails.length : 0,
      trails: category.Trails ? category.Trails.map(trail => {
        const completedSteps = completedStepsByTrail[trail.id] || [];
        const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
        
        return {
          id: trail.id,
          name: trail.name,
          order: trail.order,
          isUnlocked: trail.order === 1 || maxCompletedStep > 0, // First trail or has progress
          trailStepsCount: trail.TrailSteps ? trail.TrailSteps.length : 0,
          trailSteps: trail.TrailSteps ? trail.TrailSteps.map(step => {
            const isStepUnlocked = step.stepNumber === 1 || maxCompletedStep >= (step.stepNumber - 1);
            
            return {
              id: step.id,
              name: step.name,
              type: step.type,
              stepNumber: step.stepNumber,
              passingScore: step.passingScore,
              timeLimit: step.timeLimit,
              isUnlocked: isStepUnlocked,
              exercisesCount: step.Exercises ? step.Exercises.length : 0,
              exercises: step.Exercises ? step.Exercises.map(exercise => {
                const session = exercise.session;
                const isPassed = session && session.status === 'completed' && 
                               session.score >= step.passingScore;
                
                return {
                  id: exercise.id,
                  type: exercise.type,
                  order: exercise.order,
                  sessionId: session ? session.id : null,
                  exerciseStatus: session ? session.status : 'not_attempted',
                  score: session ? session.score : null,
                  passed: isPassed || false,
                  completedAt: session ? session.completedAt : null,
                  hasSession: !!exercise.session
                };
              }) : []
            };
          }) : []
        };
      }) : []
    }));

    res.json({
      success: true,
      debug: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching trail steps progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trail steps progress',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Create/start an exercise session
 * Creates a new session for the given exercise and user
 */
const createExerciseSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { exerciseId, isRetry } = req.body;

    // Get the exercise and verify it exists
    const exercise = await Exercise.findByPk(exerciseId, {
      include: [
        {
          model: TrailStep,
          as: 'trailStep',
          attributes: ['id', 'name', 'passingScore', 'timeLimit']
        }
      ]
    });

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'Exercise not found'
      });
    }

    // Check if user already has any session for this exercise (active or completed)
    let existingSession = await ExerciseSession.findOne({
      where: {
        userId,
        exerciseId
      },
      order: [['createdAt', 'DESC']] // Get most recent session
    });

    // If this is a retry of a failed exercise, or if there's a constraint issue, delete any existing sessions
    if (isRetry || (existingSession && existingSession.status !== 'in_progress')) {
      console.log('Handling retry or constraint cleanup for exercise:', exerciseId);
      
      // First delete any associated ExerciseSessionVocabulary records
      await sequelize.query(`
        DELETE FROM "ExerciseSessionVocabularies" 
        WHERE "sessionId" IN (
          SELECT id FROM "ExerciseSessions" 
          WHERE "userId" = :userId AND "exerciseId" = :exerciseId
        )
      `, {
        replacements: { userId, exerciseId },
        type: sequelize.QueryTypes.DELETE
      });
      
      // Then delete any UserAnswers associated with the sessions
      await sequelize.query(`
        DELETE FROM "UserAnswers" 
        WHERE "sessionId" IN (
          SELECT id FROM "ExerciseSessions" 
          WHERE "userId" = :userId AND "exerciseId" = :exerciseId
        )
      `, {
        replacements: { userId, exerciseId },
        type: sequelize.QueryTypes.DELETE
      });
      
      // Finally delete the sessions themselves
      const deleteResult = await ExerciseSession.destroy({
        where: {
          userId,
          exerciseId
        }
      });
      console.log('Deleted sessions for retry/cleanup:', deleteResult);
      existingSession = null; // Force creation of new session
    }

    // Only return existing session if it's still in progress and not expired
    if (existingSession && existingSession.status === 'in_progress' && new Date() <= existingSession.expiresAt) {
      // Continue with existing session logic
    } else {
      existingSession = null; // Force creation of new session
    }

    // If there's an existing session, we need to get the vocabulary data for it too
    if (existingSession) {
      let vocabularyData = [];
      
      if (exercise.type === 'vocabulary_matching') {
        const vocabularyIds = exercise.content.vocabularyIds || [];
        if (vocabularyIds.length > 0) {
          vocabularyData = await Vocabulary.findAll({
            where: { id: vocabularyIds },
            include: [
              {
                model: Category,
                attributes: ['id', 'name', 'language']
              }
            ],
            order: [['difficulty', 'ASC'], ['id', 'ASC']]
          });
        }
      }

      return res.json({
        success: true,
        message: 'Resuming existing session',
        session: {
          id: existingSession.id,
          exerciseId: existingSession.exerciseId,
          trailStepId: existingSession.trailStepId,
          totalQuestions: existingSession.totalQuestions,
          score: existingSession.score,
          status: existingSession.status,
          expiresAt: existingSession.expiresAt
        },
        exercise: {
          id: exercise.id,
          type: exercise.type,
          content: {
            instructions: exercise.content.instructions || 'Match the words with their translations',
            vocabulary: vocabularyData // Only include vocabulary data, not vocabularyIds
          },
          trailStep: exercise.trailStep
        }
      });
    }

    // Create new session based on exercise type
    let session;
    let totalQuestions = 0;
    let vocabularyData = [];

    if (exercise.type === 'vocabulary_matching') {
      // Get vocabulary IDs from exercise content
      const vocabularyIds = exercise.content.vocabularyIds || [];
      totalQuestions = vocabularyIds.length;

      // Get full vocabulary data
      if (vocabularyIds.length > 0) {
        vocabularyData = await Vocabulary.findAll({
          where: { id: vocabularyIds },
          include: [
            {
              model: Category,
              attributes: ['id', 'name', 'language']
            }
          ],
          order: [['difficulty', 'ASC'], ['id', 'ASC']]
        });
      }

      // Create the session
      console.log('Creating session with data:', {
        userId,
        exerciseId,
        trailStepId: exercise.trailStepId,
        totalQuestions,
        isRetry
      });
      
      session = await ExerciseSession.create({
        userId,
        exerciseId,
        trailStepId: exercise.trailStepId,
        totalQuestions
      });
      
      console.log('Session created successfully:', session.id);

      // Associate vocabulary with session
      if (vocabularyIds.length > 0) {
        const sessionVocabularyData = vocabularyIds.map(vocabId => ({
          sessionId: session.id,
          vocabularyId: vocabId
        }));
        
        await ExerciseSessionVocabulary.bulkCreate(sessionVocabularyData);
      }
    } else {
      // For other exercise types, determine question count from content
      totalQuestions = exercise.content.questions?.length || 1;
      
      session = await ExerciseSession.create({
        userId,
        exerciseId,
        trailStepId: exercise.trailStepId,
        totalQuestions
      });
    }

    res.status(201).json({
      success: true,
      message: 'Exercise session created successfully',
      session: {
        id: session.id,
        exerciseId: session.exerciseId,
        trailStepId: session.trailStepId,
        totalQuestions: session.totalQuestions,
        score: session.score,
        status: session.status,
        expiresAt: session.expiresAt
      },
      exercise: {
        id: exercise.id,
        type: exercise.type,
        content: {
          instructions: exercise.content.instructions || 'Match the words with their translations',
          vocabulary: vocabularyData // Only include vocabulary data, not vocabularyIds
        },
        trailStep: exercise.trailStep
      }
    });

  } catch (error) {
    console.error('Error creating exercise session:', error);
    console.error('Error details:', error.name, error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create exercise session',
      error: error.message,
      errorName: error.name,
      validationErrors: error.errors
    });
  }
};

/**
 * Submit individual answer for session-based exercises (MODIFIED - no nextStep)
 */
const submitAnswer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { sessionId, vocabularyId, userAnswer, exerciseDirection } = req.body;

    // Get session and verify ownership
    const session = await ExerciseSession.findOne({
      where: {
        id: sessionId,
        userId,
        status: 'in_progress'
      },
      include: [
        {
          model: Exercise,
          as: 'exercise'
        },
        {
          model: TrailStep,
          as: 'trailStep'
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Active session not found'
      });
    }

    // Check if session has expired
    if (new Date() > session.expiresAt) {
      await session.update({ status: 'abandoned' });
      return res.status(400).json({
        success: false,
        message: 'Session has expired'
      });
    }

    // Get vocabulary and determine correct answer based on exercise direction
    const vocabulary = await Vocabulary.findByPk(vocabularyId);
    if (!vocabulary) {
      return res.status(404).json({
        success: false,
        message: 'Vocabulary not found'
      });
    }

    // Determine what the correct answer should be based on the exercise content
    // Priority: 1) Request body, 2) Exercise content, 3) Default
    const direction = exerciseDirection || 
                     session.exercise?.content?.direction || 
                     'target_to_native';
    
    let correctAnswer;
    let questionWord;
    
    if (direction === 'target_to_native') {
      // Show foreign word (targetWord), expect native translation (nativeWord)
      correctAnswer = vocabulary.nativeWord.toLowerCase().trim();
      questionWord = vocabulary.targetWord;
    } else if (direction === 'native_to_target') {
      // Show native word (nativeWord), expect foreign translation (targetWord)  
      correctAnswer = vocabulary.targetWord.toLowerCase().trim();
      questionWord = vocabulary.nativeWord;
    } else {
      // Default fallback
      correctAnswer = vocabulary.nativeWord.toLowerCase().trim();
      questionWord = vocabulary.targetWord;
    }
    
    const userAnswerNormalized = userAnswer.toLowerCase().trim();
    const isCorrect = userAnswerNormalized === correctAnswer;

    // Save the answer with better error handling
    console.log('Attempting to save UserAnswer with data:', {
      userId,
      exerciseId: session.exerciseId,
      sessionId,
      vocabularyId,
      userAnswer: userAnswer.trim(),
      correctAnswer: direction === 'target_to_native' ? vocabulary.nativeWord : vocabulary.targetWord,
      isCorrect
    });
    
    try {
      const savedAnswer = await UserAnswer.create({
        userId,
        exerciseId: session.exerciseId,
        sessionId,
        vocabularyId,
        userAnswer: userAnswer.trim(),
        correctAnswer: direction === 'target_to_native' ? vocabulary.nativeWord : vocabulary.targetWord,
        isCorrect
      });
      console.log('Answer saved successfully:', savedAnswer.id);
    } catch (answerError) {
      console.error('=== ANSWER SAVE ERROR ===');
      console.error('Error saving answer:', answerError);
      console.error('Answer error details:', answerError.message);
      console.error('Answer error name:', answerError.name);
      console.error('Answer error code:', answerError.code);
      console.error('Answer error constraint:', answerError.constraint);
      if (answerError.errors) {
        console.error('Answer validation errors:', answerError.errors.map(e => ({ field: e.path, message: e.message, value: e.value, type: e.type })));
      }
      if (answerError.sql) {
        console.error('SQL that failed:', answerError.sql);
      }
      console.error('=== END ANSWER SAVE ERROR ===');
      
      // If it's a constraint violation, the session might be corrupted
      if (answerError.name === 'SequelizeUniqueConstraintError' || 
          answerError.name === 'SequelizeForeignKeyConstraintError' ||
          answerError.message.includes('constraint') ||
          answerError.message.includes('violates')) {
        console.error('Database constraint error detected - session may be corrupted');
        return res.status(500).json({
          success: false,
          message: 'Database constraint error - please restart the exercise',
          error: 'CONSTRAINT_ERROR',
          shouldRestart: true
        });
      }
      
      // For other errors, continue but log them
      console.log('Non-constraint error - continuing...');
    }

    // Update session score
    if (isCorrect) {
      await session.increment('score');
      // Refresh session to get updated score
      await session.reload();
    }

    // Check if all questions are answered correctly
    // For vocabulary matching, we need one correct answer per unique vocabulary item
    let uniqueCorrectVocabulary = 0;
    try {
      // Count distinct vocabulary IDs that have been answered correctly
      const result = await UserAnswer.findAll({
        where: { 
          sessionId,
          isCorrect: true
        },
        attributes: [[sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('vocabularyId'))), 'uniqueCount']],
        raw: true
      });
      uniqueCorrectVocabulary = parseInt(result[0]?.uniqueCount || 0);
      console.log('Unique correct vocabulary count:', uniqueCorrectVocabulary, 'Total needed:', session.totalQuestions);
    } catch (countError) {
      console.error('Error counting unique correct vocabulary:', countError);
      // If we can't count, assume session is not complete
      uniqueCorrectVocabulary = 0;
    }

    let sessionComplete = false;
    if (uniqueCorrectVocabulary >= session.totalQuestions) {
      // Complete the session
      await session.update({
        status: 'completed',
        completedAt: new Date()
      });
      sessionComplete = true;

      // Update or create user progress
      const finalScore = Math.round((session.score / session.totalQuestions) * 100);
      const passed = finalScore >= session.trailStep.passingScore;

      // Check if user progress already exists
      const existingProgress = await UserProgress.findOne({
        where: {
          userId,
          trailStepId: session.trailStepId
        }
      });

      if (existingProgress) {
        // Update existing progress
        await existingProgress.update({
          score: finalScore,
          completed: passed,
          attempts: existingProgress.attempts + 1
        });
        console.log('Updated existing user progress:', existingProgress.id);
      } else {
        // Create new progress record
        const newProgress = await UserProgress.create({
          userId,
          trailStepId: session.trailStepId,
          score: finalScore,
          completed: passed,
          attempts: 1
        });
        console.log('Created new user progress:', newProgress.id);
      }
    }

    res.json({
      success: true,
      isCorrect,
      correctAnswer: direction === 'target_to_native' ? vocabulary.nativeWord : vocabulary.targetWord,
      questionWord: questionWord,
      exerciseDirection: direction,
      currentScore: session.score,
      totalQuestions: session.totalQuestions,
      sessionComplete,
      // Removed nextStep logic - frontend will call progress endpoint
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    console.error('Error name:', error.name);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
      error: error.message,
      errorName: error.name,
      validationErrors: error.errors
    });
  }
};

/**
 * Get exercises for a specific trail step (creates/resumes session)
 * KEEPING FOR REFERENCE BUT COMMENTED OUT IN ROUTES
 */
const getExercisesByTrailStep = async (req, res) => {
  try {
    const { trailStepId } = req.params;
    const userId = req.user.id;

    // Get trail step with exercises
    const trailStep = await TrailStep.findByPk(trailStepId, {
      include: [
        {
          model: Exercise,
          include: [
            {
              model: ExerciseSession,
              as: 'session',
              where: { 
                userId,
                status: 'in_progress',
                expiresAt: { [Op.gt]: new Date() }
              },
              required: false
            }
          ]
        }
      ]
    });

    if (!trailStep) {
      return res.status(404).json({
        success: false,
        message: 'Trail step not found'
      });
    }

    res.json({
      success: true,
      trailStep,
      exercises: trailStep.Exercises
    });

  } catch (error) {
    console.error('Error fetching exercises by trail step:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exercises',
      error: error.message
    });
  }
};

/**
 * Get user progress (optionally filtered by category)
 */
const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { categoryId } = req.params;

    let whereClause = { userId };
    let includeClause = [
      {
        model: TrailStep,
        as: 'trailStep',
        include: [
          {
            model: Trail,
            include: [
              {
                model: Category,
                where: categoryId ? { id: categoryId } : {}
              }
            ]
          }
        ]
      }
    ];

    const progress = await UserProgress.findAll({
      where: whereClause,
      include: includeClause,
      order: [['updatedAt', 'DESC']]
    });

    res.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user progress',
      error: error.message
    });
  }
};

/**
 * Get vocabulary that user struggles with
 */
const getWeakVocabulary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get vocabulary where user has low success rate
    const weakVocabulary = await UserAnswer.findAll({
      where: { userId },
      include: [
        {
          model: Vocabulary,
          as: 'vocabulary',
          required: true
        }
      ],
      attributes: [
        'vocabularyId',
        [sequelize.fn('COUNT', sequelize.col('UserAnswer.id')), 'totalAttempts'],
        [sequelize.fn('SUM', sequelize.col('isCorrect')), 'correctAnswers']
      ],
      group: ['vocabularyId', 'vocabulary.id'],
      having: sequelize.literal('(SUM(isCorrect) / COUNT(*)) < 0.5'), // Less than 50% success rate
      order: [[sequelize.literal('(SUM(isCorrect) / COUNT(*))'), 'ASC']]
    });

    res.json({
      success: true,
      weakVocabulary
    });

  } catch (error) {
    console.error('Error fetching weak vocabulary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weak vocabulary',
      error: error.message
    });
  }
};

/**
 * Get session progress - which vocabularies have been tested and results
 */
const getSessionProgress = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Get session and verify ownership
    const session = await ExerciseSession.findOne({
      where: {
        id: sessionId,
        userId
      },
      include: [
        {
          model: Exercise,
          as: 'exercise',
          attributes: ['id', 'type', 'content']
        },
        {
          model: TrailStep,
          as: 'trailStep',
          attributes: ['id', 'name', 'passingScore']
        }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get all answers submitted for this session
    const submittedAnswers = await UserAnswer.findAll({
      where: { sessionId },
      include: [
        {
          model: Vocabulary,
          as: 'vocabulary',
          include: [
            {
              model: Category,
              attributes: ['id', 'name', 'language']
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']] // Order by submission time
    });

    // Get all vocabulary for this exercise
    const allVocabularyIds = session.exercise.content.vocabularyIds || [];
    const allVocabulary = await Vocabulary.findAll({
      where: { id: allVocabularyIds },
      include: [
        {
          model: Category,
          attributes: ['id', 'name', 'language']
        }
      ],
      order: [['difficulty', 'ASC'], ['id', 'ASC']]
    });

    // Create a map of tested vocabulary IDs
    const testedVocabularyIds = new Set(submittedAnswers.map(answer => answer.vocabularyId));
    
    // Separate tested and untested vocabulary
    const testedVocabulary = [];
    const untestedVocabulary = [];

    allVocabulary.forEach(vocab => {
      if (testedVocabularyIds.has(vocab.id)) {
        // Find the answer for this vocabulary
        const answer = submittedAnswers.find(ans => ans.vocabularyId === vocab.id);
        testedVocabulary.push({
          ...vocab.toJSON(),
          userAnswer: answer.userAnswer,
          correctAnswer: answer.correctAnswer,
          isCorrect: answer.isCorrect,
          submittedAt: answer.createdAt
        });
      } else {
        untestedVocabulary.push(vocab.toJSON());
      }
    });

    // Calculate progress statistics
    const totalQuestions = allVocabulary.length;
    const questionsAnswered = testedVocabulary.length;
    const questionsRemaining = untestedVocabulary.length;
    const correctAnswers = testedVocabulary.filter(v => v.isCorrect).length;
    const currentScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passingScore = session.trailStep.passingScore;
    const isCurrentlyPassing = currentScore >= passingScore;

    res.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        score: session.score,
        totalQuestions: session.totalQuestions,
        expiresAt: session.expiresAt,
        exercise: session.exercise,
        trailStep: session.trailStep
      },
      progress: {
        totalQuestions,
        questionsAnswered,
        questionsRemaining,
        correctAnswers,
        incorrectAnswers: questionsAnswered - correctAnswers,
        currentScore,
        passingScore,
        isCurrentlyPassing,
        percentComplete: Math.round((questionsAnswered / totalQuestions) * 100)
      },
      vocabulary: {
        tested: testedVocabulary,
        untested: untestedVocabulary
      }
    });

  } catch (error) {
    console.error('Error fetching session progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch session progress',
      error: error.message
    });
  }
};

/**
 * Get category summary with trail and exercise statistics
 */
const getCategorySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all categories for user's target language with related data
    const categories = await Category.findAll({
      where: {
        language: req.user.targetLanguage
      },
      include: [
        {
          model: Trail,
          required: false,
          include: [
            {
              model: TrailStep,
              required: false,
              include: [
                {
                  model: Exercise,
                  required: false,
                  include: [
                    {
                      model: ExerciseSession,
                      as: 'session',
                      where: { userId },
                      required: false,
                      attributes: ['id', 'status', 'score', 'completedAt', 'totalQuestions']
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      order: [['difficulty', 'ASC'], ['name', 'ASC']]
    });

    // Get user progress for calculating completed trails
    const userProgress = await UserProgress.findAll({
      where: { 
        userId,
        completed: true 
      },
      include: [
        {
          model: TrailStep,
          as: 'trailStep',
          include: [
            {
              model: Trail,
              include: [
                {
                  model: Category,
                  where: { language: req.user.targetLanguage }
                }
              ]
            }
          ]
        }
      ]
    });

    // Create a map of completed steps by trail
    const completedStepsByTrail = userProgress.reduce((acc, progress) => {
      const trailId = progress.trailStep.Trail.id;
      if (!acc[trailId]) acc[trailId] = 0;
      acc[trailId]++;
      return acc;
    }, {});

    // Calculate summary for each category
    const result = categories.map(category => {
      let totalTrails = 0;
      let completedTrails = 0;
      let totalExercises = 0;
      let passedExercises = 0;
      let failedExercises = 0;

      if (category.Trails) {
        totalTrails = category.Trails.length;

        category.Trails.forEach(trail => {
          const trailStepsCount = trail.TrailSteps ? trail.TrailSteps.length : 0;
          const completedStepsCount = completedStepsByTrail[trail.id] || 0;
          
          // A trail is considered completed if all its steps are completed
          if (trailStepsCount > 0 && completedStepsCount >= trailStepsCount) {
            completedTrails++;
          }

          // Count exercises
          if (trail.TrailSteps) {
            trail.TrailSteps.forEach(step => {
              if (step.Exercises) {
                step.Exercises.forEach(exercise => {
                  totalExercises++;
                  
                  if (exercise.session) {
                    const session = exercise.session;
                    if (session.status === 'completed') {
                      // Calculate percentage score: (session.score / totalQuestions) * 100
                      const totalQuestions = session.totalQuestions || 1;
                      const percentageScore = Math.round((session.score / totalQuestions) * 100);
                      
                      if (percentageScore >= step.passingScore) {
                        passedExercises++;
                      } else {
                        failedExercises++;
                      }
                    }
                  }
                });
              }
            });
          }
        });
      }

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        language: category.language,
        difficulty: category.difficulty,
        trailsCount: totalTrails,
        completedTrails,
        totalExercises,
        passedExercises,
        failedExercises
      };
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching category summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category summary',
      error: error.message
    });
  }
};

module.exports = {
  getTrailStepsProgress,
  getCategorySummary,    // Add this new function
  createExerciseSession,
  submitAnswer,
  getExercisesByTrailStep,
  getUserProgress,
  getWeakVocabulary,
  getSessionProgress
};