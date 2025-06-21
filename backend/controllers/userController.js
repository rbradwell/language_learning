// controllers/userController.js
const { 
    UserProgress,
    UserAnswer,
    ExerciseSession,
    ExerciseSessionVocabulary,
    User,
    sequelize
  } = require('../models');
  
  /**
   * Clear all progress data for a user
   * Removes: UserProgress, UserAnswers, ExerciseSessions, ExerciseSessionVocabulary
   * Keeps: User account, Categories, Trails, TrailSteps, Exercises, Vocabulary
   */
  const clearUserProgress = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      
      console.log(`Starting progress clear for user: ${userId}`);
      
      // Get counts before deletion for confirmation
      const beforeCounts = {
        userAnswers: await UserAnswer.count({ where: { userId } }),
        userProgress: await UserProgress.count({ where: { userId } }),
        exerciseSessions: await ExerciseSession.count({ where: { userId } })
      };
      
      console.log('Before deletion counts:', beforeCounts);
      
      // Step 1: Delete UserAnswers (references ExerciseSession, so delete first)
      const deletedAnswers = await UserAnswer.destroy({
        where: { userId },
        transaction
      });
      console.log(`Deleted ${deletedAnswers} user answers`);
      
      // Step 2: Delete ExerciseSessionVocabulary entries for user's sessions
      const userSessionIds = await ExerciseSession.findAll({
        where: { userId },
        attributes: ['id'],
        transaction
      });
      
      const sessionIds = userSessionIds.map(session => session.id);
      
      if (sessionIds.length > 0) {
        const deletedSessionVocab = await ExerciseSessionVocabulary.destroy({
          where: { sessionId: sessionIds },
          transaction
        });
        console.log(`Deleted ${deletedSessionVocab} exercise session vocabulary entries`);
      }
      
      // Step 3: Delete ExerciseSessions
      const deletedSessions = await ExerciseSession.destroy({
        where: { userId },
        transaction
      });
      console.log(`Deleted ${deletedSessions} exercise sessions`);
      
      // Step 4: Delete UserProgress
      const deletedProgress = await UserProgress.destroy({
        where: { userId },
        transaction
      });
      console.log(`Deleted ${deletedProgress} user progress records`);
      
      // Step 5: Reset User's score and level
      const user = await User.findByPk(userId, { transaction });
      await user.update({
        totalScore: 0,
        level: 1
      }, { transaction });
      console.log('Reset user score and level');
      
      // Commit the transaction
      await transaction.commit();
      
      // Get final counts for confirmation
      const afterCounts = {
        userAnswers: await UserAnswer.count({ where: { userId } }),
        userProgress: await UserProgress.count({ where: { userId } }),
        exerciseSessions: await ExerciseSession.count({ where: { userId } })
      };
      
      console.log('After deletion counts:', afterCounts);
      
      res.json({
        success: true,
        message: 'User progress cleared successfully',
        summary: {
          deletedAnswers,
          deletedSessions,
          deletedProgress,
          userScoreReset: true,
          userLevelReset: true
        },
        counts: {
          before: beforeCounts,
          after: afterCounts
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error clearing user progress:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to clear user progress',
        error: error.message
      });
    }
  };
  
  /**
   * Clear all progress for ALL users (admin only)
   * WARNING: This will delete all progress data for every user
   */
  const clearAllUsersProgress = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('Starting complete progress clear for ALL users');
      
      // Get counts before deletion
      const beforeCounts = {
        userAnswers: await UserAnswer.count(),
        userProgress: await UserProgress.count(),
        exerciseSessions: await ExerciseSession.count(),
        exerciseSessionVocab: await ExerciseSessionVocabulary.count()
      };
      
      console.log('Before deletion counts:', beforeCounts);
      
      // Step 1: Delete all UserAnswers
      const deletedAnswers = await UserAnswer.destroy({
        where: {},
        transaction,
        truncate: true
      });
      console.log(`Deleted all user answers`);
      
      // Step 2: Delete all ExerciseSessionVocabulary
      const deletedSessionVocab = await ExerciseSessionVocabulary.destroy({
        where: {},
        transaction,
        truncate: true
      });
      console.log(`Deleted all exercise session vocabulary`);
      
      // Step 3: Delete all ExerciseSessions
      const deletedSessions = await ExerciseSession.destroy({
        where: {},
        transaction,
        truncate: true
      });
      console.log(`Deleted all exercise sessions`);
      
      // Step 4: Delete all UserProgress
      const deletedProgress = await UserProgress.destroy({
        where: {},
        transaction,
        truncate: true
      });
      console.log(`Deleted all user progress`);
      
      // Step 5: Reset all users' scores and levels
      const updatedUsers = await User.update({
        totalScore: 0,
        level: 1
      }, {
        where: {},
        transaction
      });
      console.log(`Reset ${updatedUsers[0]} users' scores and levels`);
      
      // Commit the transaction
      await transaction.commit();
      
      // Get final counts
      const afterCounts = {
        userAnswers: await UserAnswer.count(),
        userProgress: await UserProgress.count(),
        exerciseSessions: await ExerciseSession.count(),
        exerciseSessionVocab: await ExerciseSessionVocabulary.count()
      };
      
      console.log('After deletion counts:', afterCounts);
      
      res.json({
        success: true,
        message: 'All user progress cleared successfully',
        summary: {
          deletedAnswers: 'ALL',
          deletedSessions: 'ALL',
          deletedProgress: 'ALL',
          deletedSessionVocab: 'ALL',
          usersReset: updatedUsers[0]
        },
        counts: {
          before: beforeCounts,
          after: afterCounts
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error clearing all user progress:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to clear all user progress',
        error: error.message
      });
    }
  };
  
  /**
   * Get progress statistics for a user (useful before clearing)
   */
  const getProgressStatistics = async (req, res) => {
    try {
      const userId = req.user.id;
      
      const stats = {
        userAnswers: await UserAnswer.count({ where: { userId } }),
        userProgress: await UserProgress.count({ where: { userId } }),
        exerciseSessions: await ExerciseSession.count({ where: { userId } }),
        completedSteps: await UserProgress.count({ 
          where: { userId, completed: true } 
        }),
        totalScore: 0,
        level: 1
      };
      
      // Get user's current score and level
      const user = await User.findByPk(userId, {
        attributes: ['totalScore', 'level']
      });
      
      if (user) {
        stats.totalScore = user.totalScore;
        stats.level = user.level;
      }
      
      // Get session breakdown
      const sessionStats = await ExerciseSession.findAll({
        where: { userId },
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      stats.sessionBreakdown = sessionStats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.dataValues.count);
        return acc;
      }, {});
      
      res.json({
        success: true,
        statistics: stats
      });
      
    } catch (error) {
      console.error('Error getting progress statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get progress statistics',
        error: error.message
      });
    }
  };
  
  module.exports = {
    clearUserProgress,
    clearAllUsersProgress,
    getProgressStatistics
  };