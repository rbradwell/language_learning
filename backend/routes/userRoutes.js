// routes/userRoutes.js (NEW FILE)
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const {
  clearUserProgress,
  clearVocabularyProgress,
  clearSentenceProgress,
  getProgressStatistics
} = require('../controllers/userController');

/**
 * GET /api/user/progress/statistics
 * Get progress statistics for current user
 */
router.get('/progress/statistics', auth, getProgressStatistics);

/**
 * DELETE /api/user/progress/clear
 * Clear all progress for current user
 * This will delete all UserProgress, ExerciseSessions
 * and reset user's totalScore and level to defaults
 */
router.delete('/progress/clear', [
  auth,
  body('confirmClear')
    .equals('true')
    .withMessage('Must confirm progress clear by setting confirmClear to "true"')
], clearUserProgress);

/**
 * DELETE /api/user/progress/clear/vocabulary
 * Clear only vocabulary exercise progress for current user
 * This will delete UserProgress and ExerciseSessions for vocabulary exercises only
 */
router.delete('/progress/clear/vocabulary', [
  auth,
  body('confirmClear')
    .equals('true')
    .withMessage('Must confirm progress clear by setting confirmClear to "true"')
], clearVocabularyProgress);

/**
 * DELETE /api/user/progress/clear/sentences
 * Clear only sentence completion exercise progress for current user
 * This will delete UserProgress and ExerciseSessions for sentence exercises only
 */
router.delete('/progress/clear/sentences', [
  auth,
  body('confirmClear')
    .equals('true')
    .withMessage('Must confirm progress clear by setting confirmClear to "true"')
], clearSentenceProgress);

module.exports = router;