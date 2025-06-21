// routes/admin.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const {
  bulkCreateVocabularyExercises,
  runSessionCleanup
} = require('../controllers/adminController');

// Bulk create vocabulary exercises from existing vocabulary data
router.post('/bulk-create-vocabulary-exercises', [
  authMiddleware,
  body('wordsPerExercise').optional().isInt({ min: 5, max: 20 }).withMessage('Words per exercise must be between 5 and 20'),
  body('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID'),
  body('dryRun').optional().isBoolean().withMessage('Dry run must be a boolean')
], bulkCreateVocabularyExercises);

// Session cleanup endpoint (for cron jobs or manual cleanup)
router.post('/cleanup-sessions', runSessionCleanup);

module.exports = router;