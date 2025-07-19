'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Fixing vocabulary mapping using original sentence data...');

      // Original sentence data with proper word breakdown
      const sentenceData = {
        'Greetings & Socializing': {
          sentences: [
            { native: 'Hello everyone!', target: '大家你好！', words: ['大家', '你好', '！'] },
            { native: 'Good morning!', target: '早上好！', words: ['早上好', '！'] },
            { native: 'My name is John.', target: '我叫约翰。', words: ['我', '叫', '约翰', '。'] },
            { native: 'Nice to meet you.', target: '很高兴认识你。', words: ['很', '高兴', '认识', '你', '。'] },
            { native: 'See you tomorrow.', target: '明天见。', words: ['明天', '见', '。'] },
            { native: 'Thank you very much.', target: '非常感谢。', words: ['非常', '感谢', '。'] },
            { native: 'You are welcome.', target: '不用谢。', words: ['不用', '谢', '。'] },
            { native: 'Excuse me, please.', target: '对不起，请。', words: ['对不起', '，', '请', '。'] },
            { native: 'I am sorry.', target: '我很抱歉。', words: ['我', '很', '抱歉', '。'] },
            { native: 'Good night everyone.', target: '大家晚安。', words: ['大家', '晚安', '。'] },
            { native: 'How do you say this in Chinese?', target: '这个用中文怎么说？', words: ['这个', '用', '中文', '怎么', '说', '？'] },
            { native: 'I do not understand what you said.', target: '我不明白你说的话。', words: ['我', '不', '明白', '你', '说的', '话', '。'] },
            { native: 'Could you please speak more slowly?', target: '你能说得慢一点吗？', words: ['你', '能', '说得', '慢', '一点', '吗', '？'] },
            { native: 'Where are you from originally?', target: '你原来是哪里人？', words: ['你', '原来', '是', '哪里', '人', '？'] },
            { native: 'I have been studying Chinese for two years.', target: '我学中文已经两年了。', words: ['我', '学', '中文', '已经', '两年', '了', '。'] },
            { native: 'What is your phone number?', target: '你的电话号码是多少？', words: ['你的', '电话', '号码', '是', '多少', '？'] },
            { native: 'I would like to make a new friend.', target: '我想交个新朋友。', words: ['我', '想', '交个', '新', '朋友', '。'] },
            { native: 'Can you help me with this problem?', target: '你能帮我解决这个问题吗？', words: ['你', '能', '帮我', '解决', '这个', '问题', '吗', '？'] },
            { native: 'I apologize for being late to our meeting today.', target: '我为今天开会迟到向你道歉。', words: ['我', '为', '今天', '开会', '迟到', '向', '你', '道歉', '。'] },
            { native: 'Would you mind if I asked you a personal question?', target: '如果我问你一个私人问题，你介意吗？', words: ['如果', '我', '问', '你', '一个', '私人', '问题', '，', '你', '介意', '吗', '？'] },
            { native: 'I really appreciate all the help you have given me.', target: '我真的很感谢你给我的所有帮助。', words: ['我', '真的', '很', '感谢', '你', '给', '我的', '所有', '帮助', '。'] },
            { native: 'It was a pleasure meeting you at the conference yesterday.', target: '昨天在会议上遇见你很高兴。', words: ['昨天', '在', '会议', '上', '遇见', '你', '很', '高兴', '。'] }
          ]
        },
        'Food & Dining': {
          sentences: [
            { native: 'I like to eat rice.', target: '我喜欢吃米饭。', words: ['我', '喜欢', '吃', '米饭', '。'] },
            { native: 'The food is delicious.', target: '这菜很好吃。', words: ['这', '菜', '很', '好吃', '。'] },
            { native: 'I want some water.', target: '我要一些水。', words: ['我', '要', '一些', '水', '。'] },
            { native: 'We eat breakfast at home.', target: '我们在家吃早餐。', words: ['我们', '在家', '吃', '早餐', '。'] },
            { native: 'The restaurant is expensive.', target: '这家餐厅很贵。', words: ['这家', '餐厅', '很', '贵', '。'] },
            { native: 'I do not eat meat.', target: '我不吃肉。', words: ['我', '不', '吃', '肉', '。'] },
            { native: 'Please bring the menu.', target: '请拿菜单来。', words: ['请', '拿', '菜单', '来', '。'] },
            { native: 'What would you recommend from this menu?', target: '你推荐这个菜单上的什么菜？', words: ['你', '推荐', '这个', '菜单', '上的', '什么', '菜', '？'] },
            { native: 'This hotpot restaurant is always crowded on weekends.', target: '这家火锅店周末总是很拥挤。', words: ['这家', '火锅店', '周末', '总是', '很', '拥挤', '。'] },
            { native: 'I would like to order the Peking duck, please.', target: '我想点北京烤鸭，谢谢。', words: ['我', '想', '点', '北京烤鸭', '，', '谢谢', '。'] },
            { native: 'The chef prepared this dish with fresh ingredients.', target: '厨师用新鲜的食材做这道菜。', words: ['厨师', '用', '新鲜的', '食材', '做', '这道', '菜', '。'] },
            { native: 'The authentic Sichuan cuisine here has the perfect balance of spicy and numbing flavors.', target: '这里正宗的川菜有完美的麻辣平衡。', words: ['这里', '正宗的', '川菜', '有', '完美的', '麻辣', '平衡', '。'] },
            { native: 'After trying many restaurants, I believe this place serves the best dumplings in the city.', target: '尝试了很多餐厅后，我认为这里的饺子是城里最好的。', words: ['尝试了', '很多', '餐厅', '后', '，', '我', '认为', '这里的', '饺子', '是', '城里', '最好的', '。'] }
          ]
        },
        'Health & Body': {
          sentences: [
            { native: 'I feel sick today.', target: '我今天感觉不舒服。', words: ['我', '今天', '感觉', '不舒服', '。'] },
            { native: 'My head hurts.', target: '我头疼。', words: ['我', '头疼', '。'] },
            { native: 'I need to see a doctor.', target: '我需要看医生。', words: ['我', '需要', '看', '医生', '。'] },
            { native: 'Exercise is good for health.', target: '运动对健康有好处。', words: ['运动', '对', '健康', '有', '好处', '。'] },
            { native: 'I brush my teeth every morning.', target: '我每天早上刷牙。', words: ['我', '每天', '早上', '刷牙', '。'] },
            { native: 'The doctor prescribed medicine for my cold.', target: '医生给我开了治感冒的药。', words: ['医生', '给', '我', '开了', '治', '感冒', '的', '药', '。'] },
            { native: 'Regular exercise and healthy eating help prevent disease.', target: '定期运动和健康饮食有助于预防疾病。', words: ['定期', '运动', '和', '健康', '饮食', '有助于', '预防', '疾病', '。'] },
            { native: 'I have been feeling stressed lately due to work pressure.', target: '我最近因为工作压力感到压力很大。', words: ['我', '最近', '因为', '工作', '压力', '感到', '压力', '很大', '。'] },
            { native: 'The comprehensive health checkup revealed that all my vital signs are within normal ranges.', target: '全面的健康检查显示我所有的生命体征都在正常范围内。', words: ['全面的', '健康', '检查', '显示', '我', '所有的', '生命', '体征', '都', '在', '正常', '范围', '内', '。'] }
          ]
        }
      };

      // Get categories mapping
      const categories = await queryInterface.sequelize.query(
        `SELECT id, name FROM "Categories" WHERE name IN ('Greetings & Socializing', 'Food & Dining', 'Health & Body')`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      // Get all vocabularies for mapping
      const vocabularies = await queryInterface.sequelize.query(
        `SELECT id, "categoryId", "targetWord" FROM "Vocabularies"`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      const vocabMap = {};
      vocabularies.forEach(vocab => {
        const key = `${vocab.categoryId}-${vocab.targetWord}`;
        vocabMap[key] = vocab.id;
      });

      // Get all sentences
      const sentences = await queryInterface.sequelize.query(
        `SELECT id, "categoryId", "targetText" FROM "Sentences"`,
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Processing ${sentences.length} sentences...`);

      let fixedCount = 0;
      
      // Process each sentence
      for (const sentence of sentences) {
        let matchingSentenceData = null;
        
        // Find the sentence in our data by matching target text
        for (const [categoryName, data] of Object.entries(sentenceData)) {
          const found = data.sentences.find(s => s.target === sentence.targetText);
          if (found) {
            matchingSentenceData = found;
            break;
          }
        }
        
        if (!matchingSentenceData) {
          console.log(`No matching data found for sentence: "${sentence.targetText}"`);
          continue;
        }

        // Map words to vocabulary IDs
        const vocabularyIds = [];
        for (const word of matchingSentenceData.words) {
          const vocabKey = `${sentence.categoryId}-${word}`;
          const vocabId = vocabMap[vocabKey];
          
          if (vocabId) {
            vocabularyIds.push(vocabId);
          } else {
            console.log(`No vocabulary found for word "${word}" in category ${sentence.categoryId}`);
          }
        }

        if (vocabularyIds.length > 0) {
          // Update the sentence with correct vocabulary mapping
          await queryInterface.sequelize.query(
            `UPDATE "Sentences" 
             SET "vocabularyIds" = :vocabularyIds, "sentenceLength" = :sentenceLength
             WHERE id = :id`,
            {
              replacements: {
                id: sentence.id,
                vocabularyIds: JSON.stringify(vocabularyIds),
                sentenceLength: matchingSentenceData.words.length
              },
              type: queryInterface.sequelize.QueryTypes.UPDATE,
              transaction
            }
          );
          
          fixedCount++;
          console.log(`✓ Fixed "${sentence.targetText}" -> ${vocabularyIds.length} vocabulary IDs`);
        }
      }

      // Remove wordPositions column
      await queryInterface.removeColumn('Sentences', 'wordPositions', { transaction });

      await transaction.commit();
      console.log(`Successfully fixed ${fixedCount} sentences and removed wordPositions column`);
      
    } catch (error) {
      await transaction.rollback();
      console.error('Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Re-add wordPositions column
      await queryInterface.addColumn('Sentences', 'wordPositions', {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: '[]'
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};