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
