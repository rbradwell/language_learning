// routes/exercises.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getExercisesByTrailStep,
  submitAnswer,
  getUserProgress,
  getWeakVocabulary,
  getTrailStepsProgress,    // Get comprehensive progress overview
  getCategorySummary,       // Get category overview with statistics
  createExerciseSession,    // Start an exercise session
  getSessionProgress        // Get session-specific progress
} = require('../controllers/exerciseController');

// Get category summary with trail and exercise statistics
router.get('/category-summary', authMiddleware, getCategorySummary);

// Get comprehensive trail steps progress for user
router.get('/trail-steps-progress', authMiddleware, getTrailStepsProgress);

// Create/start an exercise session
router.post('/start-exercise', [
  authMiddleware,
  body('exerciseId').isUUID().withMessage('Valid exercise ID required')
], createExerciseSession);

// Get exercises for a specific trail step (creates/resumes session) - COMMENTED OUT FOR NOW
// router.get('/trail-step/:trailStepId', authMiddleware, getExercisesByTrailStep);

// Submit individual answer for session-based exercises (MODIFIED - no nextStep)
router.post('/submit-answer', [
  authMiddleware,
  body('sessionId').isUUID().withMessage('Valid session ID required'),
  body('vocabularyId').isUUID().withMessage('Valid vocabulary ID required'),
  body('userAnswer').notEmpty().withMessage('User answer is required'),
  body('exerciseDirection').optional().isIn(['target_to_native', 'native_to_target']).withMessage('Exercise direction must be target_to_native or native_to_target')
], submitAnswer);

// Get user progress (optionally filtered by category)
router.get('/progress/:categoryId?', authMiddleware, getUserProgress);

// Get session progress - which vocabularies have been tested
router.get('/session-progress/:sessionId', authMiddleware, getSessionProgress);

// Get vocabulary that user struggles with
router.get('/weak-vocabulary', authMiddleware, getWeakVocabulary);

module.exports = router;

// Create/start an exercise session
router.post('/start-exercise', [
  authMiddleware,
  body('exerciseId').isUUID().withMessage('Valid exercise ID required')
], createExerciseSession);

// Get exercises for a specific trail step (creates/resumes session) - COMMENTED OUT FOR NOW
// router.get('/trail-step/:trailStepId', authMiddleware, getExercisesByTrailStep);

// Submit individual answer for session-based exercises (MODIFIED - no nextStep)
router.post('/submit-answer', [
  authMiddleware,
  body('sessionId').isUUID().withMessage('Valid session ID required'),
  body('vocabularyId').isUUID().withMessage('Valid vocabulary ID required'),
  body('userAnswer').notEmpty().withMessage('User answer is required'),
  body('exerciseDirection').optional().isIn(['target_to_native', 'native_to_target']).withMessage('Exercise direction must be target_to_native or native_to_target')
], submitAnswer);

// Get user progress (optionally filtered by category)
router.get('/progress/:categoryId?', authMiddleware, getUserProgress);

// Get session progress - which vocabularies have been tested
router.get('/session-progress/:sessionId', authMiddleware, getSessionProgress);

// Get vocabulary that user struggles with
router.get('/weak-vocabulary', authMiddleware, getWeakVocabulary);

module.exports = router;