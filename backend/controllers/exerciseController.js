// controllers/exerciseController.js
const { validationResult } = require('express-validator');
const { 
  Category, 
  Trail, 
  TrailStep, 
  ExerciseSession, 
  ExerciseSessionVocabulary,
  UserProgress,
  Vocabulary,
  VocabularyMatchingExercises,
  SentenceCompletionExercises,
  FillBlanksExercises,
  Sentence,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

// Constants
const NUM_DISTRACTORS = 3;
const MIN_VOCABULARY_NEEDED = NUM_DISTRACTORS + 1; // 1 correct answer + distractors

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

    // Step 5: Check vocabulary matching exercises
    const allVocabExercises = await VocabularyMatchingExercises.findAll();
    console.log('All vocabulary matching exercises in database:', allVocabExercises.length);

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
                  model: VocabularyMatchingExercises,
                  required: false,
                  include: [
                    {
                      model: ExerciseSession,
                      as: 'session',
                      required: false,
                      attributes: ['id', 'status', 'score', 'completedAt', 'userId']
                    }
                  ]
                },
                {
                  model: SentenceCompletionExercises,
                  required: false,
                  include: [
                    {
                      model: ExerciseSession,
                      as: 'session',
                      required: false,
                      attributes: ['id', 'status', 'score', 'completedAt', 'userId']
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
              console.log(`      - VocabularyMatchingExercises: ${step.VocabularyMatchingExercises ? step.VocabularyMatchingExercises.length : 'No VocabularyMatchingExercises property'}`);
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
          attributes: ['id', 'trailId', 'stepNumber', 'passingScore'],
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
              exercisesCount: (step.VocabularyMatchingExercises ? step.VocabularyMatchingExercises.length : 0) + 
                              (step.SentenceCompletionExercises ? step.SentenceCompletionExercises.length : 0),
              hasExercises: ((step.VocabularyMatchingExercises ? step.VocabularyMatchingExercises.length : 0) + 
                           (step.SentenceCompletionExercises ? step.SentenceCompletionExercises.length : 0)) > 0,
              exercises: [
                // Vocabulary matching exercises
                ...(step.VocabularyMatchingExercises ? step.VocabularyMatchingExercises.map(exercise => {
                  const session = exercise.session && exercise.session.userId === userId ? exercise.session : null;
                  
                  // For vocabulary matching exercises, completion means all questions were answered correctly
                  // since users must get each question right to proceed to the next one
                  let isPassed = false;
                  if (session && session.status === 'completed') {
                    isPassed = true; // Vocabulary matching: if completed, user got all questions right
                  }
                  
                  return {
                    id: exercise.id,
                    type: 'vocabulary_matching',
                    order: exercise.order,
                    sessionId: session ? session.id : null,
                    exerciseStatus: session ? session.status : 'not_attempted',
                    score: session ? session.score : null,
                    passed: isPassed || false,
                    completedAt: session ? session.completedAt : null,
                    hasSession: !!session
                  };
                }) : []),
                
                // Sentence completion exercises  
                ...(step.SentenceCompletionExercises ? step.SentenceCompletionExercises.map(exercise => {
                  const session = exercise.session && exercise.session.userId === userId ? exercise.session : null;
                  
                  // For sentence completion exercises, check if score meets passing score
                  let isPassed = false;
                  if (session && session.status === 'completed') {
                    const sessionScore = Math.round((session.score / session.totalQuestions) * 100);
                    isPassed = sessionScore >= step.passingScore;
                  }
                  
                  return {
                    id: exercise.id,
                    type: 'sentence_completion',
                    order: exercise.order,
                    difficulty: exercise.difficulty,
                    sessionId: session ? session.id : null,
                    exerciseStatus: session ? session.status : 'not_attempted',
                    score: session ? session.score : null,
                    passed: isPassed || false,
                    completedAt: session ? session.completedAt : null,
                    hasSession: !!session
                  };
                }) : [])
              ]
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

    // Try to get the exercise from VocabularyMatchingExercises table first
    let exercise = await VocabularyMatchingExercises.findByPk(exerciseId, {
      include: [
        {
          model: TrailStep,
          as: 'trailStep',
          attributes: ['id', 'name', 'type', 'passingScore', 'timeLimit']
        }
      ]
    });
      
    // Add type field for consistency
    if (exercise) {
      exercise.type = 'vocabulary_matching';
    } else {
      // Try to get from SentenceCompletionExercises table
      exercise = await SentenceCompletionExercises.findByPk(exerciseId, {
        include: [
          {
            model: TrailStep,
            as: 'trailStep',
            attributes: ['id', 'name', 'type', 'passingScore', 'timeLimit']
          }
        ]
      });
      
      if (exercise) {
        exercise.type = 'sentence_completion';
      }
      
      // If not found, try FillBlanksExercises table
      if (!exercise) {
        exercise = await FillBlanksExercises.findByPk(exerciseId, {
          include: [
            {
              model: TrailStep,
              as: 'trailStep',
              attributes: ['id', 'name', 'type', 'passingScore', 'timeLimit']
            }
          ]
        });
        
        if (exercise) {
          exercise.type = 'fill_blanks';
        }
      }
    }

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

    // Only delete sessions if this is an explicit retry
    if (isRetry && existingSession) {
      console.log('Handling explicit retry for exercise:', exerciseId);
      
      // First delete any associated ExerciseSessionVocabulary records
      await sequelize.query(`
        DELETE FROM "ExerciseSessionVocabularies" 
        WHERE "sessionId" = :sessionId
      `, {
        replacements: { sessionId: existingSession.id },
        type: sequelize.QueryTypes.DELETE
      });
      
      // Then delete any UserAnswers associated with the session
      await sequelize.query(`
        DELETE FROM "UserAnswers" 
        WHERE "sessionId" = :sessionId
      `, {
        replacements: { sessionId: existingSession.id },
        type: sequelize.QueryTypes.DELETE
      });
      
      // Finally delete the session itself
      await existingSession.destroy();
      console.log('Deleted session for explicit retry:', existingSession.id);
      existingSession = null; // Force creation of new session
    }

    // Return existing session if it's still in progress and not expired
    if (existingSession && existingSession.status === 'in_progress' && new Date() <= existingSession.expiresAt) {
      // Continue with existing session logic
    } else if (existingSession && existingSession.status === 'completed') {
      // Don't allow starting a completed exercise unless it's an explicit retry
      return res.status(400).json({
        success: false,
        message: 'Exercise already completed',
        alreadyCompleted: true
      });
    } else {
      existingSession = null; // Force creation of new session
    }

    // If there's an existing session, we need to get the data for it too
    if (existingSession) {
      let vocabularyData = [];
      let sentenceData = [];
      
      if (exercise.type === 'vocabulary_matching') {
        const vocabularyIds = exercise.vocabularyIds || [];
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
      } else if (exercise.type === 'sentence_completion' || exercise.type === 'fill_blanks') {
        const sentenceIds = exercise.sentenceIds || [];
        if (sentenceIds.length > 0) {
          sentenceData = await Sentence.findAll({
            where: { id: sentenceIds },
            include: [
              {
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'language']
              }
            ],
            order: [['difficulty', 'ASC'], ['sentenceLength', 'ASC']]
          });

          // Get vocabulary for sentences
          const allVocabularyIds = [];
          sentenceData.forEach(sentence => {
            const vocabIds = sentence.vocabularyIds || [];
            allVocabularyIds.push(...vocabIds);
          });

          const uniqueVocabularyIds = [...new Set(allVocabularyIds)];
          if (uniqueVocabularyIds.length > 0) {
            vocabularyData = await Vocabulary.findAll({
              where: { id: uniqueVocabularyIds },
              include: [
                {
                  model: Category,
                  attributes: ['id', 'name', 'language']
                }
              ]
            });
          }
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
          content: exercise.type === 'sentence_completion' ? {
            instructions: exercise.instructions || 'Complete each sentence by placing the missing words in the correct positions',
            sentences: sentenceData,
            vocabulary: vocabularyData,
            missingWordCount: exercise.missingWordCount || 3
          } : {
            instructions: exercise.instructions || 'Match the words with their translations',
            vocabulary: vocabularyData
          },
          trailStep: exercise.trailStep
        }
      });
    }

    // Create new session based on exercise type
    let session;
    let totalQuestions = 0;
    let vocabularyData = [];
    let sentenceData = [];

    if (exercise.type === 'vocabulary_matching') {
      const vocabularyIds = exercise.vocabularyIds || [];
      totalQuestions = vocabularyIds.length;

      // Get vocabulary data with enough distractors
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

        // If we don't have enough vocabulary for distractors
        if (vocabularyData.length < MIN_VOCABULARY_NEEDED) {
          const categoryId = vocabularyData[0]?.Category?.id;
          if (categoryId) {
            // Get additional vocabulary from same category
            const additionalVocab = await Vocabulary.findAll({
              include: [
                {
                  model: Category,
                  where: { id: categoryId },
                  attributes: ['id', 'name', 'language']
                }
              ],
              where: {
                id: { [Op.notIn]: vocabularyIds }
              },
              limit: MIN_VOCABULARY_NEEDED - vocabularyData.length, // Only get what we need
              order: [['difficulty', 'ASC'], ['id', 'ASC']]
            });
            
            vocabularyData = [...vocabularyData, ...additionalVocab];
          }
        }
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
    } else if (exercise.type === 'sentence_completion' || exercise.type === 'fill_blanks') {
      const sentenceIds = exercise.sentenceIds || [];
      totalQuestions = sentenceIds.length;

      // Get sentence data with vocabulary information
      if (sentenceIds.length > 0) {
        sentenceData = await Sentence.findAll({
          where: { id: sentenceIds },
          include: [
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'name', 'language']
            }
          ],
          order: [['difficulty', 'ASC'], ['sentenceLength', 'ASC']]
        });

        // Get all vocabulary used in these sentences
        const allVocabularyIds = [];
        sentenceData.forEach(sentence => {
          const vocabIds = sentence.vocabularyIds || [];
          allVocabularyIds.push(...vocabIds);
        });

        // Remove duplicates and get vocabulary data
        const uniqueVocabularyIds = [...new Set(allVocabularyIds)];
        if (uniqueVocabularyIds.length > 0) {
          vocabularyData = await Vocabulary.findAll({
            where: { id: uniqueVocabularyIds },
            include: [
              {
                model: Category,
                attributes: ['id', 'name', 'language']
              }
            ]
          });
        }
      }

      // Create the session
      console.log(`Creating ${exercise.type} session with data:`, {
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
      
      console.log(`${exercise.type} session created successfully:`, session.id);
    } else {
      // For other exercise types, determine question count from content
      totalQuestions = exercise.content?.questions?.length || 1;
      
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
        content: (exercise.type === 'sentence_completion' || exercise.type === 'fill_blanks') ? {
          instructions: exercise.type === 'fill_blanks' 
            ? 'Complete each sentence by typing missing words in pinyin. The pinyin will be converted to Chinese characters that you can use to build the sentence.'
            : 'Complete each sentence by placing the missing words in the correct positions',
          sentences: sentenceData,
          vocabulary: vocabularyData,
          missingWordCount: exercise.missingWordCount || 3
        } : {
          instructions: exercise.instructions || 'Match the words with their translations',
          vocabulary: vocabularyData
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
    const { sessionId, vocabularyId, userAnswer, exerciseDirection, sentenceId } = req.body;

    // Get session and verify ownership
    const session = await ExerciseSession.findOne({
      where: {
        id: sessionId,
        userId,
        status: 'in_progress'
      },
      include: [
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

    let correctAnswer;
    let isCorrect;
    let questionData = {};

    if (vocabularyId) {
      // Handle vocabulary matching exercise
      const vocabulary = await Vocabulary.findByPk(vocabularyId);
      if (!vocabulary) {
        return res.status(404).json({
          success: false,
          message: 'Vocabulary not found'
        });
      }

      // Use the exercise direction from the request or default to native_to_target
      const direction = exerciseDirection || 'native_to_target';
      
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
      isCorrect = userAnswerNormalized === correctAnswer;
      
      questionData = {
        type: 'vocabulary',
        vocabularyId,
        direction,
        questionWord,
        correctAnswer: direction === 'target_to_native' ? vocabulary.nativeWord : vocabulary.targetWord
      };

    } else if (sentenceId) {
      // Handle sentence completion exercise
      const sentence = await Sentence.findByPk(sentenceId);
      if (!sentence) {
        return res.status(404).json({
          success: false,
          message: 'Sentence not found'
        });
      }

      // Get the exercise to find which words should be in the sentence
      const exercise = await SentenceCompletionExercises.findByPk(session.exerciseId);
      if (!exercise) {
        return res.status(404).json({
          success: false,
          message: 'Exercise not found'
        });
      }

      // Get vocabulary for this sentence
      const vocabularyIds = sentence.vocabularyIds || [];
      const vocabulary = await Vocabulary.findAll({
        where: { id: vocabularyIds }
      });

      // Build correct answer by finding all vocabulary words in the target text in order
      const targetText = sentence.targetText;
      const vocabularyWords = vocabulary.map(v => v.targetWord);
      
      const correctWords = [];
      let searchPosition = 0;
      
      // Find vocabulary words in order they appear in target text
      while (searchPosition < targetText.length) {
        let nextWord = null;
        let nextPosition = targetText.length;
        
        for (const word of vocabularyWords) {
          const wordPosition = targetText.indexOf(word, searchPosition);
          if (wordPosition !== -1 && wordPosition < nextPosition) {
            nextPosition = wordPosition;
            nextWord = word;
          }
        }
        
        if (nextWord) {
          correctWords.push(nextWord);
          searchPosition = nextPosition + nextWord.length;
        } else {
          break;
        }
      }

      correctAnswer = correctWords.join(' ');
      isCorrect = userAnswer.trim() === correctAnswer;
      
      questionData = {
        type: 'sentence',
        sentenceId,
        targetText: sentence.targetText,
        nativeText: sentence.nativeText,
        correctAnswer
      };

    } else {
      return res.status(400).json({
        success: false,
        message: 'Either vocabularyId or sentenceId must be provided'
      });
    }

    // Note: Individual answers are not stored in the current system
    // Only session-level progress is tracked in ExerciseSession table

    // Log the answer for debugging
    console.log('Answer submitted:', {
      userId,
      exerciseId: session.exerciseId,
      sessionId,
      vocabularyId: vocabularyId || null,
      sentenceId: sentenceId || null,
      userAnswer: userAnswer.trim(),
      correctAnswer,
      isCorrect,
      type: questionData.type
    });

    // Update session score
    if (isCorrect) {
      // Only increment score if it won't exceed total questions
      // This prevents double-counting when retrying incorrect sentences
      if (session.score < session.totalQuestions) {
        await session.increment('score');
        // Refresh session to get updated score
        await session.reload();
      }
    }

    // For vocabulary matching, complete the session when the user gets an answer right
    // Since we no longer track individual answers in UserAnswer table, 
    // we'll use the session score to determine completion
    let sessionComplete = false;
    if (session.score >= session.totalQuestions) {
      // Complete the session
      await session.update({
        status: 'completed',
        completedAt: new Date()
      });
      sessionComplete = true;

      // Update or create user progress
      const finalScore = Math.round((session.score / session.totalQuestions) * 100);

      // Check if ALL exercises in this trail step have been completed
      // Get all exercises in this trail step (both vocabulary matching and sentence completion)
      const vocabExercises = await VocabularyMatchingExercises.findAll({
        where: { trailStepId: session.trailStepId }
      });
      
      const sentenceExercises = await SentenceCompletionExercises.findAll({
        where: { trailStepId: session.trailStepId }
      });
      
      const allExercisesInStep = [...vocabExercises, ...sentenceExercises];

      // Get all completed sessions for this user in this trail step
      const completedSessions = await ExerciseSession.findAll({
        where: {
          userId,
          trailStepId: session.trailStepId,
          status: 'completed'
        }
      });

      // Get the trail step to access passingScore
      const trailStep = await TrailStep.findByPk(session.trailStepId);
      const passingScore = trailStep.passingScore;

      // Check if all exercises have passing scores
      const exercisesWithPassingScores = completedSessions.filter(sessionRecord => {
        // Find if this session's exercise is a vocabulary matching exercise
        const isVocabExercise = vocabExercises.some(ve => ve.id === sessionRecord.exerciseId);
        const isSentenceExercise = sentenceExercises.some(se => se.id === sessionRecord.exerciseId);
        
        if (isVocabExercise) {
          // Vocabulary matching: if session is completed, it's automatically passed
          return true;
        } else if (isSentenceExercise) {
          // Sentence completion: use percentage-based passing score
          const sessionScore = Math.round((sessionRecord.score / sessionRecord.totalQuestions) * 100);
          return sessionScore >= passingScore;
        } else {
          // Other exercise types: use percentage-based passing score
          const sessionScore = Math.round((sessionRecord.score / sessionRecord.totalQuestions) * 100);
          return sessionScore >= passingScore;
        }
      });

      // Trail step is complete only if all exercises have been passed
      const allExercisesCompleted = exercisesWithPassingScores.length >= allExercisesInStep.length;
      
      console.log('Trail step completion check:');
      console.log('  Total exercises in step:', allExercisesInStep.length);
      console.log('  Exercises with passing scores:', exercisesWithPassingScores.length);
      console.log('  All exercises completed:', allExercisesCompleted);

      // Calculate average score across all completed exercises
      const averageScore = exercisesWithPassingScores.length > 0 
        ? Math.round(exercisesWithPassingScores.reduce((sum, session) => {
            return sum + Math.round((session.score / session.totalQuestions) * 100);
          }, 0) / exercisesWithPassingScores.length)
        : finalScore;

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
          score: averageScore,
          completed: allExercisesCompleted,
          attempts: existingProgress.attempts + 1
        });
        console.log('Updated existing user progress:', existingProgress.id);
      } else {
        // Create new progress record
        const newProgress = await UserProgress.create({
          userId,
          trailStepId: session.trailStepId,
          score: averageScore,
          completed: allExercisesCompleted,
          attempts: 1
        });
        console.log('Created new user progress:', newProgress.id);
      }
    }

    res.json({
      success: true,
      isCorrect,
      correctAnswer,
      currentScore: session.score,
      totalQuestions: session.totalQuestions,
      sessionComplete
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
                  model: VocabularyMatchingExercises,
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
                },
                {
                  model: SentenceCompletionExercises,
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
              // Count vocabulary matching exercises
              if (step.VocabularyMatchingExercises) {
                step.VocabularyMatchingExercises.forEach(exercise => {
                  totalExercises++;
                  
                  if (exercise.session) {
                    const session = exercise.session;
                    if (session.status === 'completed') {
                      // Vocabulary matching exercises are automatically passed if completed
                      passedExercises++;
                    }
                  }
                });
              }
              
              // Count sentence completion exercises
              if (step.SentenceCompletionExercises) {
                step.SentenceCompletionExercises.forEach(exercise => {
                  totalExercises++;
                  
                  if (exercise.session) {
                    const session = exercise.session;
                    if (session.status === 'completed') {
                      // Sentence completion: check if score meets passing score
                      const sessionScore = Math.round((session.score / session.totalQuestions) * 100);
                      if (sessionScore >= step.passingScore) {
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
        iconPath: category.iconPath,
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