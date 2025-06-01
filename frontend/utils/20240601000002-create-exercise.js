// migrations/20240601000002-create-exercise.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Exercises', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      trailStepId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'TrailSteps',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
        allowNull: false
      },
      content: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: 'Stores exercise data as JSON (sentences, options, etc.)'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Exercises', ['trailStepId']);
    await queryInterface.addIndex('Exercises', ['type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Exercises');
  }
};

// models/Exercise.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Exercise = sequelize.define('Exercise', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    trailStepId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('vocabulary_matching', 'sentence_completion', 'fill_blanks'),
      allowNull: false
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Stores exercise data as JSON'
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  });

  Exercise.associate = (models) => {
    Exercise.belongsTo(models.TrailStep, {
      foreignKey: 'trailStepId',
      as: 'trailStep'
    });
  };

  return Exercise;
};

// Additional seeder for more comprehensive sentence exercises
// seeders/20240601000002-add-more-exercises.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get existing trail steps
      const trailSteps = await queryInterface.sequelize.query(
        'SELECT ts.*, t."categoryId", c.language FROM "TrailSteps" ts JOIN "Trails" t ON ts."trailId" = t.id JOIN "Categories" c ON t."categoryId" = c.id',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      const exercises = [];

      // Advanced Mandarin exercises
      const advancedMandarinExercises = {
        'sentence_completion': [
          {
            targetSentence: '我每天___去上班。',
            translation: 'I take the subway to work every day.',
            missingWord: '坐地铁',
            options: ['坐地铁', '开车', '走路', '骑车'],
            correctOption: 0,
            difficulty: 2
          },
          {
            targetSentence: '这个___很便宜，只要十块钱。',
            translation: 'This apple is very cheap, only ten yuan.',
            missingWord: '苹果',
            options: ['橙子', '苹果', '香蕉', '葡萄'],
            correctOption: 1,
            difficulty: 2
          },
          {
            targetSentence: '明天的___很好，我们去公园吧。',
            translation: 'Tomorrow\'s weather is very good, let\'s go to the park.',
            missingWord: '天气',
            options: ['天气', '时间', '地方', '人'],
            correctOption: 0,
            difficulty: 2
          },
          {
            targetSentence: '我想买一件新___。',
            translation: 'I want to buy a new shirt.',
            missingWord: '衣服',
            options: ['衣服', '鞋子', '帽子', '包'],
            correctOption: 0,
            difficulty: 1
          },
          {
            targetSentence: '这家___的菜很好吃。',
            translation: 'This restaurant\'s food is very delicious.',
            missingWord: '餐厅',
            options: ['商店', '餐厅', '银行', '医院'],
            correctOption: 1,
            difficulty: 2
          }
        ],
        'fill_blanks': [
          {
            targetSentence: '我的___是医生，他在医院工作。',
            translation: 'My father is a doctor, he works at the hospital.',
            blanks: [{ position: 2, answer: '爸爸', hint: 'male parent' }],
            difficulty: 2
          },
          {
            targetSentence: '今天很___，我要穿厚衣服。',
            translation: 'Today is very cold, I need to wear thick clothes.',
            blanks: [{ position: 2, answer: '冷', hint: 'opposite of hot' }],
            difficulty: 1
          },
          {
            targetSentence: '我每天喝很多___。',
            translation: 'I drink a lot of water every day.',
            blanks: [{ position: 4, answer: '水', hint: 'clear liquid essential for life' }],
            difficulty: 1
          },
          {
            targetSentence: '我的___很漂亮，她是老师。',
            translation: 'My mother is very beautiful, she is a teacher.',
            blanks: [{ position: 2, answer: '妈妈', hint: 'female parent' }],
            difficulty: 1
          },
          {
            targetSentence: '这辆___很贵，要五万块钱。',
            translation: 'This car is very expensive, it costs fifty thousand yuan.',
            blanks: [{ position: 2, answer: '汽车', hint: 'vehicle with four wheels' }],
            difficulty: 2
          }
        ]
      };

      // Advanced Portuguese exercises
      const advancedPortugueseExercises = {
        'sentence_completion': [
          {
            targetSentence: 'Eu vou ao ___ comprar frutas.',
            translation: 'I am going to the market to buy fruits.',
            missingWord: 'mercado',
            options: ['hospital', 'mercado', 'escola', 'restaurante'],
            correctOption: 1,
            difficulty: 2
          },
          {
            targetSentence: 'O ___ está muito quente hoje.',
            translation: 'The weather is very hot today.',
            missingWord: 'tempo',
            options: ['tempo', 'vento', 'chuva', 'frio'],
            correctOption: 0,
            difficulty: 2
          },
          {
            targetSentence: 'Minha ___ trabalha no escritório.',
            translation: 'My mother works in the office.',
            missingWord: 'mãe',
            options: ['mãe', 'pai', 'irmã', 'filha'],
            correctOption: 0,
            difficulty: 2
          },
          {
            targetSentence: 'Eu preciso de ___ para pagar a conta.',
            translation: 'I need money to pay the bill.',
            missingWord: 'dinheiro',
            options: ['cartão', 'dinheiro', 'tempo', 'ajuda'],
            correctOption: 1,
            difficulty: 2
          },
          {
            targetSentence: 'O ___ está chegando, vamos correr!',
            translation: 'The bus is coming, let\'s run!',
            missingWord: 'ônibus',
            options: ['carro', 'ônibus', 'trem', 'táxi'],
            correctOption: 1,
            difficulty: 2
          }
        ],
        'fill_blanks': [
          {
            targetSentence: 'Eu preciso comprar ___ para o jantar.',
            translation: 'I need to buy bread for dinner.',
            blanks: [{ position: 3, answer: 'pão', hint: 'baked food made from flour' }],
            difficulty: 1
          },
          {
            targetSentence: 'O ___ do restaurante é muito caro.',
            translation: 'The restaurant\'s menu is very expensive.',
            blanks: [{ position: 1, answer: 'cardápio', hint: 'list of food items' }],
            difficulty: 2
          },
          {
            targetSentence: 'Meu ___ é muito inteligente.',
            translation: 'My brother is very intelligent.',
            blanks: [{ position: 1, answer: 'irmão', hint: 'male sibling' }],
            difficulty: 1
          },
          {
            targetSentence: 'Hoje está fazendo muito ___.',
            translation: 'Today it is very cold.',
            blanks: [{ position: 4, answer: 'frio', hint: 'opposite of hot' }],
            difficulty: 1
          },
          {
            targetSentence: 'Eu vou de ___ para o trabalho.',
            translation: 'I go to work by car.',
            blanks: [{ position: 3, answer: 'carro', hint: 'four-wheeled vehicle' }],
            difficulty: 2
          }
        ]
      };

      // Add exercises for each trail step
      trailSteps.forEach(step => {
        const isMandarinCategory = step.language === 'Mandarin';
        const exerciseData = isMandarinCategory ? advancedMandarinExercises : advancedPortugueseExercises;
        
        if (exerciseData[step.type]) {
          exerciseData[step.type].forEach((exercise, index) => {
            exercises.push({
              id: uuidv4(),
              trailStepId: step.id,
              type: step.type,
              content: JSON.stringify(exercise),
              order: index + 1,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          });
        }
      });

      await queryInterface.bulkInsert('Exercises', exercises, { transaction });

      await transaction.commit();
      console.log('Advanced exercises added successfully!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.bulkDelete('Exercises', {
        createdAt: {
          [Sequelize.Op.gte]: new Date('2024-06-01')
        }
      }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

// controllers/exerciseController.js
const { Exercise, TrailStep, Trail, Category, Vocabulary, User, UserProgress, UserAnswer } = require('../models');
const { sequelize } = require('../models');

const getExercisesByTrailStep = async (req, res) => {
  try {
    const { trailStepId } = req.params;
    const { userId } = req.user;

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
        where: {
          trailId: trailStep.trailId,
          stepNumber: { [sequelize.Op.lt]: trailStep.stepNumber }
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
    const { userId } = req.user;

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
    const { userId } = req.user;
    const { categoryId } = req.params;

    const whereClause = { userId };
    const includeClause = [{
      model: TrailStep,
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
      order: [[{ model: TrailStep }, 'stepNumber', 'ASC']]
    });

    // Group progress by trail
    const progressByTrail = {};
    progress.forEach(p => {
      const trailId = p.TrailStep.Trail.id;
      if (!progressByTrail[trailId]) {
        progressByTrail[trailId] = {
          trail: {
            id: p.TrailStep.Trail.id,
            name: p.TrailStep.Trail.name,
            category: p.TrailStep.Trail.Category
          },
          steps: [],
          overallProgress: 0
        };
      }
      progressByTrail[trailId].steps.push({
        stepId: p.TrailStep.id,
        stepNumber: p.TrailStep.stepNumber,
        stepName: p.TrailStep.name,
        stepType: p.TrailStep.type,
        completed: p.completed,
        score: p.score,
        attempts: p.attempts,
        timeSpent: p.timeSpent,
        passingScore: p.TrailStep.passingScore
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
    const { userId } = req.user;
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

// routes/exercises.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const {
  getExercisesByTrailStep,
  submitExerciseResults,
  getUserProgress,
  getWeakVocabulary
} = require('../controllers/exerciseController');

// Get exercises for a specific trail step
router.get('/trail-step/:trailStepId', auth, getExercisesByTrailStep);

// Submit exercise results
router.post('/submit', [
  auth,
  body('trailStepId').isUUID().withMessage('Valid trail step ID required'),
  body('score').isInt({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
  body('answers').optional().isArray().withMessage('Answers must be an array')
], submitExerciseResults);

// Get user progress
router.get('/progress/:categoryId?', auth, getUserProgress);

// Get vocabulary user struggles with (for review section)
router.get('/weak-vocabulary', auth, getWeakVocabulary);

module.exports = router;

// Frontend API service
// services/exerciseAPI.js
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const getAuthToken = async () => {
  // Implementation depends on your auth storage method
  // Example: return await AsyncStorage.getItem('authToken');
};

export const ExerciseAPI = {
  // Get exercises for a trail step
  getExercises: async (trailStepId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/exercises/trail-step/${trailStepId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching exercises:', error);
      throw error;
    }
  },

  // Submit exercise results
  submitResults: async (results) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/exercises/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(results)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting results:', error);
      throw error;
    }
  },

  // Get user progress
  getProgress: async (categoryId = null) => {
    try {
      const token = await getAuthToken();
      const url = categoryId 
        ? `${API_BASE_URL}/exercises/progress/${categoryId}`
        : `${API_BASE_URL}/exercises/progress`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  },

  // Get weak vocabulary for review
  getWeakVocabulary: async (limit = 20) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/exercises/weak-vocabulary?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching weak vocabulary:', error);
      throw error;
    }
  }
};