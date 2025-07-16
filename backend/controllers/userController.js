// controllers/userController.js
const { 
    UserProgress,
    ExerciseSession,
    ExerciseSessionVocabulary,
    VocabularyMatchingExercises,
    SentenceCompletionExercises,
    User,
    sequelize
  } = require('../models');
  
  /**
   * Clear all progress data for a user
   * Removes: UserProgress, ExerciseSessions, ExerciseSessionVocabulary
   * Keeps: User account, Categories, Trails, TrailSteps, Exercises, Vocabulary
   */
  const clearUserProgress = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      
      console.log(`Starting progress clear for user: ${userId}`);
      
      // Get counts before deletion for confirmation
      const beforeCounts = {
        userProgress: await UserProgress.count({ where: { userId } }),
        exerciseSessions: await ExerciseSession.count({ where: { userId } })
      };
      
      console.log('Before deletion counts:', beforeCounts);
      
      // Step 1: Delete ExerciseSessionVocabulary entries for user's sessions
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
      
      // Step 2: Delete ExerciseSessions
      const deletedSessions = await ExerciseSession.destroy({
        where: { userId },
        transaction
      });
      console.log(`Deleted ${deletedSessions} exercise sessions`);
      
      // Step 3: Delete UserProgress
      const deletedProgress = await UserProgress.destroy({
        where: { userId },
        transaction
      });
      console.log(`Deleted ${deletedProgress} user progress records`);
      
      // Step 4: Reset User's score and level
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
        userProgress: await UserProgress.count({ where: { userId } }),
        exerciseSessions: await ExerciseSession.count({ where: { userId } })
      };
      
      console.log('After deletion counts:', afterCounts);
      
      res.json({
        success: true,
        message: 'User progress cleared successfully',
        summary: {
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
        userProgress: await UserProgress.count(),
        exerciseSessions: await ExerciseSession.count(),
        exerciseSessionVocab: await ExerciseSessionVocabulary.count()
      };
      
      console.log('Before deletion counts:', beforeCounts);
      
      // Step 1: Delete all ExerciseSessionVocabulary
      const deletedSessionVocab = await ExerciseSessionVocabulary.destroy({
        where: {},
        transaction,
        truncate: true
      });
      console.log(`Deleted all exercise session vocabulary`);
      
      // Step 2: Delete all ExerciseSessions
      const deletedSessions = await ExerciseSession.destroy({
        where: {},
        transaction,
        truncate: true
      });
      console.log(`Deleted all exercise sessions`);
      
      // Step 3: Delete all UserProgress
      const deletedProgress = await UserProgress.destroy({
        where: {},
        transaction,
        truncate: true
      });
      console.log(`Deleted all user progress`);
      
      // Step 4: Reset all users' scores and levels
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
        userProgress: await UserProgress.count(),
        exerciseSessions: await ExerciseSession.count(),
        exerciseSessionVocab: await ExerciseSessionVocabulary.count()
      };
      
      console.log('After deletion counts:', afterCounts);
      
      res.json({
        success: true,
        message: 'All user progress cleared successfully',
        summary: {
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
  
  /**
   * Clear only vocabulary exercise progress for a user
   * Removes: UserProgress, ExerciseSessions, ExerciseSessionVocabulary for vocabulary exercises only
   */
  const clearVocabularyProgress = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      
      console.log(`Starting vocabulary progress clear for user: ${userId}`);
      
      // Get all vocabulary exercise IDs
      const vocabularyExercises = await VocabularyMatchingExercises.findAll({
        attributes: ['id'],
        transaction
      });
      
      const vocabularyExerciseIds = vocabularyExercises.map(ex => ex.id);
      
      if (vocabularyExerciseIds.length === 0) {
        await transaction.commit();
        return res.json({
          success: true,
          message: 'No vocabulary exercises found - nothing to clear',
          summary: {
            deletedSessions: 0,
            deletedProgress: 0
          }
        });
      }
      
      // Get vocabulary exercise sessions for this user
      const vocabularySessionIds = await ExerciseSession.findAll({
        where: { 
          userId,
          exerciseId: vocabularyExerciseIds
        },
        attributes: ['id'],
        transaction
      });
      
      const sessionIds = vocabularySessionIds.map(session => session.id);
      
      // Get counts before deletion for confirmation
      const beforeCounts = {
        vocabularySessions: sessionIds.length,
        vocabularyProgress: await UserProgress.count({ 
          where: { 
            userId,
            trailStepId: {
              [sequelize.Sequelize.Op.in]: await sequelize.query(
                'SELECT DISTINCT "trailStepId" FROM "ExerciseSessions" WHERE "userId" = :userId AND "exerciseId" IN (:exerciseIds)',
                {
                  replacements: { userId, exerciseIds: vocabularyExerciseIds },
                  type: sequelize.QueryTypes.SELECT,
                  transaction
                }
              ).then(results => results.map(r => r.trailStepId))
            }
          }
        })
      };
      
      console.log('Before vocabulary deletion counts:', beforeCounts);
      
      // Step 1: Delete ExerciseSessionVocabulary entries for vocabulary sessions
      if (sessionIds.length > 0) {
        const deletedSessionVocab = await ExerciseSessionVocabulary.destroy({
          where: { sessionId: sessionIds },
          transaction
        });
        console.log(`Deleted ${deletedSessionVocab} vocabulary exercise session vocabulary entries`);
      }
      
      // Step 2: Delete vocabulary ExerciseSessions
      const deletedSessions = await ExerciseSession.destroy({
        where: { 
          userId,
          exerciseId: vocabularyExerciseIds
        },
        transaction
      });
      console.log(`Deleted ${deletedSessions} vocabulary exercise sessions`);
      
      // Step 3: Get trail step IDs that only had vocabulary exercises and delete their UserProgress
      const allTrailStepIds = await sequelize.query(
        'SELECT DISTINCT "trailStepId" FROM "VocabularyMatchingExercises" WHERE id IN (:exerciseIds)',
        {
          replacements: { exerciseIds: vocabularyExerciseIds },
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      let deletedProgress = 0;
      for (const row of allTrailStepIds) {
        const trailStepId = row.trailStepId;
        
        // Check if this trail step has any sentence completion exercises
        const hasSentenceExercises = await SentenceCompletionExercises.count({
          where: { trailStepId },
          transaction
        });
        
        // Only delete UserProgress if there are no sentence exercises in this trail step
        // or if the user has no completed sentence sessions for this trail step
        if (hasSentenceExercises === 0) {
          const deletedProgressForStep = await UserProgress.destroy({
            where: { userId, trailStepId },
            transaction
          });
          deletedProgress += deletedProgressForStep;
        } else {
          // Check if user has any completed sentence sessions for this trail step
          const completedSentenceSessions = await ExerciseSession.count({
            where: {
              userId,
              trailStepId,
              status: 'completed'
            },
            include: [{
              model: sequelize.models.SentenceCompletionExercises,
              where: {},
              required: true
            }],
            transaction
          });
          
          // If no completed sentence sessions, we can safely delete the UserProgress
          if (completedSentenceSessions === 0) {
            const deletedProgressForStep = await UserProgress.destroy({
              where: { userId, trailStepId },
              transaction
            });
            deletedProgress += deletedProgressForStep;
          }
        }
      }
      
      console.log(`Deleted ${deletedProgress} user progress records for vocabulary-only trail steps`);
      
      // Commit the transaction
      await transaction.commit();
      
      // Get final counts for confirmation
      const afterCounts = {
        vocabularySessions: await ExerciseSession.count({ 
          where: { 
            userId,
            exerciseId: vocabularyExerciseIds
          }
        }),
        totalSessions: await ExerciseSession.count({ where: { userId } })
      };
      
      console.log('After vocabulary deletion counts:', afterCounts);
      
      res.json({
        success: true,
        message: 'Vocabulary progress cleared successfully',
        summary: {
          deletedSessions,
          deletedProgress,
          vocabularyExercisesCount: vocabularyExerciseIds.length
        },
        counts: {
          before: beforeCounts,
          after: afterCounts
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error clearing vocabulary progress:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to clear vocabulary progress',
        error: error.message
      });
    }
  };

  /**
   * Clear only sentence completion exercise progress for a user
   * Removes: UserProgress, ExerciseSessions for sentence exercises only
   */
  const clearSentenceProgress = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const userId = req.user.id;
      
      console.log(`Starting sentence progress clear for user: ${userId}`);
      
      // Get all sentence completion exercise IDs
      const sentenceExercises = await SentenceCompletionExercises.findAll({
        attributes: ['id'],
        transaction
      });
      
      const sentenceExerciseIds = sentenceExercises.map(ex => ex.id);
      
      if (sentenceExerciseIds.length === 0) {
        await transaction.commit();
        return res.json({
          success: true,
          message: 'No sentence completion exercises found - nothing to clear',
          summary: {
            deletedSessions: 0,
            deletedProgress: 0
          }
        });
      }
      
      // Get counts before deletion for confirmation
      const beforeCounts = {
        sentenceSessions: await ExerciseSession.count({ 
          where: { 
            userId,
            exerciseId: sentenceExerciseIds
          }
        }),
        sentenceProgress: await UserProgress.count({ 
          where: { 
            userId,
            trailStepId: {
              [sequelize.Sequelize.Op.in]: await sequelize.query(
                'SELECT DISTINCT "trailStepId" FROM "SentenceCompletionExercises" WHERE id IN (:exerciseIds)',
                {
                  replacements: { exerciseIds: sentenceExerciseIds },
                  type: sequelize.QueryTypes.SELECT,
                  transaction
                }
              ).then(results => results.map(r => r.trailStepId))
            }
          }
        })
      };
      
      console.log('Before sentence deletion counts:', beforeCounts);
      
      // Step 1: Delete sentence ExerciseSessions (no ExerciseSessionVocabulary for sentences)
      const deletedSessions = await ExerciseSession.destroy({
        where: { 
          userId,
          exerciseId: sentenceExerciseIds
        },
        transaction
      });
      console.log(`Deleted ${deletedSessions} sentence exercise sessions`);
      
      // Step 2: Get trail step IDs that only had sentence exercises and delete their UserProgress
      const allTrailStepIds = await sequelize.query(
        'SELECT DISTINCT "trailStepId" FROM "SentenceCompletionExercises" WHERE id IN (:exerciseIds)',
        {
          replacements: { exerciseIds: sentenceExerciseIds },
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );
      
      let deletedProgress = 0;
      for (const row of allTrailStepIds) {
        const trailStepId = row.trailStepId;
        
        // Check if this trail step has any vocabulary matching exercises
        const hasVocabularyExercises = await VocabularyMatchingExercises.count({
          where: { trailStepId },
          transaction
        });
        
        // Only delete UserProgress if there are no vocabulary exercises in this trail step
        // or if the user has no completed vocabulary sessions for this trail step
        if (hasVocabularyExercises === 0) {
          const deletedProgressForStep = await UserProgress.destroy({
            where: { userId, trailStepId },
            transaction
          });
          deletedProgress += deletedProgressForStep;
        } else {
          // Check if user has any completed vocabulary sessions for this trail step
          const completedVocabularySessions = await ExerciseSession.count({
            where: {
              userId,
              trailStepId,
              status: 'completed'
            },
            include: [{
              model: sequelize.models.VocabularyMatchingExercises,
              where: {},
              required: true
            }],
            transaction
          });
          
          // If no completed vocabulary sessions, we can safely delete the UserProgress
          if (completedVocabularySessions === 0) {
            const deletedProgressForStep = await UserProgress.destroy({
              where: { userId, trailStepId },
              transaction
            });
            deletedProgress += deletedProgressForStep;
          }
        }
      }
      
      console.log(`Deleted ${deletedProgress} user progress records for sentence-only trail steps`);
      
      // Commit the transaction
      await transaction.commit();
      
      // Get final counts for confirmation
      const afterCounts = {
        sentenceSessions: await ExerciseSession.count({ 
          where: { 
            userId,
            exerciseId: sentenceExerciseIds
          }
        }),
        totalSessions: await ExerciseSession.count({ where: { userId } })
      };
      
      console.log('After sentence deletion counts:', afterCounts);
      
      res.json({
        success: true,
        message: 'Sentence completion progress cleared successfully',
        summary: {
          deletedSessions,
          deletedProgress,
          sentenceExercisesCount: sentenceExerciseIds.length
        },
        counts: {
          before: beforeCounts,
          after: afterCounts
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error clearing sentence progress:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to clear sentence progress',
        error: error.message
      });
    }
  };

  module.exports = {
    clearUserProgress,
    clearAllUsersProgress,
    getProgressStatistics,
    clearVocabularyProgress,
    clearSentenceProgress
  };