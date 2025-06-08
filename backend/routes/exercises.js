// routes/exercises.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  getExercisesByTrailStep,
  submitExerciseResults,
  getUserProgress,
  getWeakVocabulary
} = require('../controllers/exerciseController');
const { Op } = require('sequelize');

// Get exercises for a specific trail step
router.get('/trail-step/:trailStepId', authMiddleware, getExercisesByTrailStep);

// Submit exercise results
router.post('/submit', [
  authMiddleware,
  body('trailStepId').isUUID().withMessage('Valid trail step ID required'),
  body('score').isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
  body('answers').optional().isArray().withMessage('Answers must be an array')
], submitExerciseResults);

router.get('/trail-step/:trailStepId', authMiddleware, getExercisesByTrailStep);
router.post('/submit', authMiddleware, submitExerciseResults);
router.get('/progress/:categoryId?', authMiddleware, getUserProgress);
router.get('/weak-vocabulary', authMiddleware, getWeakVocabulary);

module.exports = router;
