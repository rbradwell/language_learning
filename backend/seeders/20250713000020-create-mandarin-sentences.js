'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('Creating Mandarin sentences and missing vocabulary...');
      
      // Get categories for Mandarin
      const categories = await queryInterface.sequelize.query(`
        SELECT id, name FROM "Categories" WHERE language = 'Mandarin'
      `, { type: Sequelize.QueryTypes.SELECT, transaction });
      
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      // Get existing vocabulary to avoid duplicates
      const existingVocab = await queryInterface.sequelize.query(`
        SELECT "targetWord", "nativeWord", "categoryId" FROM "Vocabularies"
        WHERE "categoryId" IN (${categories.map(c => `'${c.id}'`).join(',')})
      `, { type: Sequelize.QueryTypes.SELECT, transaction });
      
      const existingVocabSet = new Set(
        existingVocab.map(v => `${v.targetWord}-${v.nativeWord}-${v.categoryId}`)
      );

      // Comprehensive sentence data for each category
      const sentenceData = {
        'Greetings & Basic Interactions': {
          sentences: [
            // Beginner sentences (3-4 words)
            { native: 'Hello, how are you?', target: '你好，你好吗？', words: ['你好', '，', '你好', '吗', '？'], difficulty: 'beginner', pattern: 'greeting-question' },
            { native: 'Good morning everyone.', target: '大家早上好。', words: ['大家', '早上好', '。'], difficulty: 'beginner', pattern: 'greeting-group' },
            { native: 'My name is John.', target: '我叫约翰。', words: ['我', '叫', '约翰', '。'], difficulty: 'beginner', pattern: 'self-introduction' },
            { native: 'Nice to meet you.', target: '很高兴认识你。', words: ['很', '高兴', '认识', '你', '。'], difficulty: 'beginner', pattern: 'polite-greeting' },
            { native: 'See you tomorrow.', target: '明天见。', words: ['明天', '见', '。'], difficulty: 'beginner', pattern: 'farewell' },
            { native: 'Thank you very much.', target: '非常感谢。', words: ['非常', '感谢', '。'], difficulty: 'beginner', pattern: 'gratitude' },
            { native: 'You are welcome.', target: '不用谢。', words: ['不用', '谢', '。'], difficulty: 'beginner', pattern: 'polite-response' },
            { native: 'Excuse me, please.', target: '对不起，请。', words: ['对不起', '，', '请', '。'], difficulty: 'beginner', pattern: 'polite-request' },
            { native: 'I am sorry.', target: '我很抱歉。', words: ['我', '很', '抱歉', '。'], difficulty: 'beginner', pattern: 'apology' },
            { native: 'Good night everyone.', target: '大家晚安。', words: ['大家', '晚安', '。'], difficulty: 'beginner', pattern: 'evening-farewell' },
            
            // Intermediate sentences (5-7 words)
            { native: 'How do you say this in Chinese?', target: '这个用中文怎么说？', words: ['这个', '用', '中文', '怎么', '说', '？'], difficulty: 'intermediate', pattern: 'language-question' },
            { native: 'I do not understand what you said.', target: '我不明白你说的话。', words: ['我', '不', '明白', '你', '说的', '话', '。'], difficulty: 'intermediate', pattern: 'comprehension-issue' },
            { native: 'Could you please speak more slowly?', target: '你能说得慢一点吗？', words: ['你', '能', '说得', '慢', '一点', '吗', '？'], difficulty: 'intermediate', pattern: 'speed-request' },
            { native: 'Where are you from originally?', target: '你原来是哪里人？', words: ['你', '原来', '是', '哪里', '人', '？'], difficulty: 'intermediate', pattern: 'origin-question' },
            { native: 'I have been studying Chinese for two years.', target: '我学中文已经两年了。', words: ['我', '学', '中文', '已经', '两年', '了', '。'], difficulty: 'intermediate', pattern: 'duration-statement' },
            { native: 'What is your phone number?', target: '你的电话号码是多少？', words: ['你的', '电话', '号码', '是', '多少', '？'], difficulty: 'intermediate', pattern: 'contact-question' },
            { native: 'I would like to make a new friend.', target: '我想交个新朋友。', words: ['我', '想', '交个', '新', '朋友', '。'], difficulty: 'intermediate', pattern: 'friendship-desire' },
            { native: 'Can you help me with this problem?', target: '你能帮我解决这个问题吗？', words: ['你', '能', '帮我', '解决', '这个', '问题', '吗', '？'], difficulty: 'intermediate', pattern: 'help-request' },
            
            // Advanced sentences (8+ words)
            { native: 'I apologize for being late to our meeting today.', target: '我为今天开会迟到向你道歉。', words: ['我', '为', '今天', '开会', '迟到', '向', '你', '道歉', '。'], difficulty: 'advanced', pattern: 'formal-apology' },
            { native: 'Would you mind if I asked you a personal question?', target: '如果我问你一个私人问题，你介意吗？', words: ['如果', '我', '问', '你', '一个', '私人', '问题', '，', '你', '介意', '吗', '？'], difficulty: 'advanced', pattern: 'polite-inquiry' },
            { native: 'I really appreciate all the help you have given me.', target: '我真的很感谢你给我的所有帮助。', words: ['我', '真的', '很', '感谢', '你', '给', '我的', '所有', '帮助', '。'], difficulty: 'advanced', pattern: 'deep-gratitude' },
            { native: 'It was a pleasure meeting you at the conference yesterday.', target: '昨天在会议上遇见你很高兴。', words: ['昨天', '在', '会议', '上', '遇见', '你', '很', '高兴', '。'], difficulty: 'advanced', pattern: 'past-meeting-pleasure' }
          ],
          newVocabulary: [
            { target: '你好', native: 'hello', pronunciation: 'nǐ hǎo', difficulty: 1 },
            { target: '吗', native: 'question particle', pronunciation: 'ma', difficulty: 1 },
            { target: '大家', native: 'everyone', pronunciation: 'dà jiā', difficulty: 1 },
            { target: '早上好', native: 'good morning', pronunciation: 'zǎo shang hǎo', difficulty: 1 },
            { target: '我', native: 'I/me', pronunciation: 'wǒ', difficulty: 1 },
            { target: '叫', native: 'to be called', pronunciation: 'jiào', difficulty: 1 },
            { target: '约翰', native: 'John', pronunciation: 'yuē hàn', difficulty: 1 },
            { target: '很', native: 'very', pronunciation: 'hěn', difficulty: 1 },
            { target: '高兴', native: 'happy', pronunciation: 'gāo xìng', difficulty: 1 },
            { target: '认识', native: 'to know/meet', pronunciation: 'rèn shi', difficulty: 1 },
            { target: '你', native: 'you', pronunciation: 'nǐ', difficulty: 1 },
            { target: '明天', native: 'tomorrow', pronunciation: 'míng tiān', difficulty: 1 },
            { target: '见', native: 'to see/meet', pronunciation: 'jiàn', difficulty: 1 },
            { target: '非常', native: 'very much', pronunciation: 'fēi cháng', difficulty: 1 },
            { target: '感谢', native: 'to thank', pronunciation: 'gǎn xiè', difficulty: 1 },
            { target: '不用', native: 'no need', pronunciation: 'bù yòng', difficulty: 1 },
            { target: '谢', native: 'to thank', pronunciation: 'xiè', difficulty: 1 },
            { target: '对不起', native: 'sorry', pronunciation: 'duì bu qǐ', difficulty: 1 },
            { target: '请', native: 'please', pronunciation: 'qǐng', difficulty: 1 },
            { target: '抱歉', native: 'sorry', pronunciation: 'bào qiàn', difficulty: 1 },
            { target: '晚安', native: 'good night', pronunciation: 'wǎn ān', difficulty: 1 },
            { target: '这个', native: 'this', pronunciation: 'zhè ge', difficulty: 2 },
            { target: '用', native: 'to use', pronunciation: 'yòng', difficulty: 2 },
            { target: '中文', native: 'Chinese language', pronunciation: 'zhōng wén', difficulty: 2 },
            { target: '怎么', native: 'how', pronunciation: 'zěn me', difficulty: 2 },
            { target: '说', native: 'to speak', pronunciation: 'shuō', difficulty: 2 },
            { target: '不', native: 'not', pronunciation: 'bù', difficulty: 1 },
            { target: '明白', native: 'to understand', pronunciation: 'míng bai', difficulty: 2 },
            { target: '说的', native: 'said/spoken', pronunciation: 'shuō de', difficulty: 2 },
            { target: '话', native: 'words/speech', pronunciation: 'huà', difficulty: 2 },
            { target: '能', native: 'can/able', pronunciation: 'néng', difficulty: 2 },
            { target: '说得', native: 'speak (with result)', pronunciation: 'shuō de', difficulty: 2 },
            { target: '慢', native: 'slow', pronunciation: 'màn', difficulty: 2 },
            { target: '一点', native: 'a little', pronunciation: 'yī diǎn', difficulty: 2 },
            { target: '原来', native: 'originally', pronunciation: 'yuán lái', difficulty: 2 },
            { target: '是', native: 'to be', pronunciation: 'shì', difficulty: 1 },
            { target: '哪里', native: 'where', pronunciation: 'nǎ lǐ', difficulty: 2 },
            { target: '人', native: 'person', pronunciation: 'rén', difficulty: 1 },
            { target: '学', native: 'to study', pronunciation: 'xué', difficulty: 2 },
            { target: '已经', native: 'already', pronunciation: 'yǐ jīng', difficulty: 2 },
            { target: '两年', native: 'two years', pronunciation: 'liǎng nián', difficulty: 2 },
            { target: '了', native: 'particle (completion)', pronunciation: 'le', difficulty: 1 },
            { target: '你的', native: 'your', pronunciation: 'nǐ de', difficulty: 1 },
            { target: '电话', native: 'telephone', pronunciation: 'diàn huà', difficulty: 2 },
            { target: '号码', native: 'number', pronunciation: 'hào mǎ', difficulty: 2 },
            { target: '多少', native: 'how much/many', pronunciation: 'duō shao', difficulty: 2 },
            { target: '想', native: 'to want/think', pronunciation: 'xiǎng', difficulty: 2 },
            { target: '交个', native: 'to make (friends)', pronunciation: 'jiāo ge', difficulty: 2 },
            { target: '新', native: 'new', pronunciation: 'xīn', difficulty: 1 },
            { target: '朋友', native: 'friend', pronunciation: 'péng you', difficulty: 2 },
            { target: '帮我', native: 'help me', pronunciation: 'bāng wǒ', difficulty: 2 },
            { target: '解决', native: 'to solve', pronunciation: 'jiě jué', difficulty: 3 },
            { target: '问题', native: 'problem', pronunciation: 'wèn tí', difficulty: 2 }
          ]
        },

        'Family & Relationships': {
          sentences: [
            // Beginner sentences
            { native: 'This is my family.', target: '这是我的家人。', words: ['这', '是', '我的', '家人', '。'], difficulty: 'beginner', pattern: 'family-introduction' },
            { native: 'I have two brothers.', target: '我有两个哥哥。', words: ['我', '有', '两个', '哥哥', '。'], difficulty: 'beginner', pattern: 'sibling-count' },
            { native: 'My mother is very kind.', target: '我妈妈很善良。', words: ['我', '妈妈', '很', '善良', '。'], difficulty: 'beginner', pattern: 'parent-description' },
            { native: 'My father works hard.', target: '我爸爸工作很努力。', words: ['我', '爸爸', '工作', '很', '努力', '。'], difficulty: 'beginner', pattern: 'parent-work' },
            { native: 'She is my sister.', target: '她是我妹妹。', words: ['她', '是', '我', '妹妹', '。'], difficulty: 'beginner', pattern: 'sibling-identification' },
            { native: 'We love each other.', target: '我们相爱。', words: ['我们', '相爱', '。'], difficulty: 'beginner', pattern: 'mutual-love' },
            { native: 'My grandparents are healthy.', target: '我的祖父母很健康。', words: ['我的', '祖父母', '很', '健康', '。'], difficulty: 'beginner', pattern: 'grandparent-health' },
            
            // Intermediate sentences  
            { native: 'My older brother is getting married next month.', target: '我哥哥下个月要结婚了。', words: ['我', '哥哥', '下个月', '要', '结婚', '了', '。'], difficulty: 'intermediate', pattern: 'future-marriage' },
            { native: 'Our family celebrates birthdays together every year.', target: '我们家每年一起庆祝生日。', words: ['我们', '家', '每年', '一起', '庆祝', '生日', '。'], difficulty: 'intermediate', pattern: 'family-tradition' },
            { native: 'My cousin lives in Beijing with her husband.', target: '我表姐和她丈夫住在北京。', words: ['我', '表姐', '和', '她', '丈夫', '住在', '北京', '。'], difficulty: 'intermediate', pattern: 'relative-location' },
            { native: 'Both my parents graduated from university.', target: '我父母都是大学毕业的。', words: ['我', '父母', '都', '是', '大学', '毕业', '的', '。'], difficulty: 'intermediate', pattern: 'parent-education' },
            
            // Advanced sentences
            { native: 'My family has always been very supportive of my career decisions.', target: '我的家人一直很支持我的职业决定。', words: ['我的', '家人', '一直', '很', '支持', '我的', '职业', '决定', '。'], difficulty: 'advanced', pattern: 'family-support' },
            { native: 'Despite our differences, we maintain close family relationships.', target: '尽管我们有分歧，但仍保持密切的家庭关系。', words: ['尽管', '我们', '有', '分歧', '，', '但', '仍', '保持', '密切的', '家庭', '关系', '。'], difficulty: 'advanced', pattern: 'family-harmony' }
          ],
          newVocabulary: [
            { target: '家人', native: 'family member', pronunciation: 'jiā rén', difficulty: 1 },
            { target: '有', native: 'to have', pronunciation: 'yǒu', difficulty: 1 },
            { target: '两个', native: 'two (of something)', pronunciation: 'liǎng ge', difficulty: 1 },
            { target: '哥哥', native: 'older brother', pronunciation: 'gē ge', difficulty: 1 },
            { target: '妈妈', native: 'mother', pronunciation: 'mā ma', difficulty: 1 },
            { target: '善良', native: 'kind', pronunciation: 'shàn liáng', difficulty: 2 },
            { target: '爸爸', native: 'father', pronunciation: 'bà ba', difficulty: 1 },
            { target: '工作', native: 'to work', pronunciation: 'gōng zuò', difficulty: 1 },
            { target: '努力', native: 'hardworking', pronunciation: 'nǔ lì', difficulty: 2 },
            { target: '她', native: 'she/her', pronunciation: 'tā', difficulty: 1 },
            { target: '妹妹', native: 'younger sister', pronunciation: 'mèi mei', difficulty: 1 },
            { target: '我们', native: 'we/us', pronunciation: 'wǒ men', difficulty: 1 },
            { target: '相爱', native: 'to love each other', pronunciation: 'xiāng ài', difficulty: 2 },
            { target: '祖父母', native: 'grandparents', pronunciation: 'zǔ fù mǔ', difficulty: 2 },
            { target: '健康', native: 'healthy', pronunciation: 'jiàn kāng', difficulty: 2 },
            { target: '下个月', native: 'next month', pronunciation: 'xià ge yuè', difficulty: 2 },
            { target: '要', native: 'will/going to', pronunciation: 'yào', difficulty: 1 },
            { target: '结婚', native: 'to get married', pronunciation: 'jié hūn', difficulty: 2 },
            { target: '家', native: 'home/family', pronunciation: 'jiā', difficulty: 1 },
            { target: '每年', native: 'every year', pronunciation: 'měi nián', difficulty: 2 },
            { target: '一起', native: 'together', pronunciation: 'yī qǐ', difficulty: 2 },
            { target: '庆祝', native: 'to celebrate', pronunciation: 'qìng zhù', difficulty: 2 },
            { target: '生日', native: 'birthday', pronunciation: 'shēng rì', difficulty: 2 },
            { target: '表姐', native: 'older female cousin', pronunciation: 'biǎo jiě', difficulty: 2 },
            { target: '和', native: 'and', pronunciation: 'hé', difficulty: 1 },
            { target: '丈夫', native: 'husband', pronunciation: 'zhàng fu', difficulty: 2 },
            { target: '住在', native: 'to live in', pronunciation: 'zhù zài', difficulty: 2 },
            { target: '北京', native: 'Beijing', pronunciation: 'běi jīng', difficulty: 2 },
            { target: '父母', native: 'parents', pronunciation: 'fù mǔ', difficulty: 2 },
            { target: '都', native: 'all/both', pronunciation: 'dōu', difficulty: 1 },
            { target: '大学', native: 'university', pronunciation: 'dà xué', difficulty: 2 },
            { target: '毕业', native: 'to graduate', pronunciation: 'bì yè', difficulty: 2 },
            { target: '的', native: 'possessive particle', pronunciation: 'de', difficulty: 1 }
          ]
        },

        'Food & Dining': {
          sentences: [
            // Beginner sentences
            { native: 'I like to eat rice.', target: '我喜欢吃米饭。', words: ['我', '喜欢', '吃', '米饭', '。'], difficulty: 'beginner', pattern: 'food-preference' },
            { native: 'The food is delicious.', target: '这菜很好吃。', words: ['这', '菜', '很', '好吃', '。'], difficulty: 'beginner', pattern: 'food-taste' },
            { native: 'I want some water.', target: '我要一些水。', words: ['我', '要', '一些', '水', '。'], difficulty: 'beginner', pattern: 'drink-request' },
            { native: 'We eat breakfast at home.', target: '我们在家吃早餐。', words: ['我们', '在家', '吃', '早餐', '。'], difficulty: 'beginner', pattern: 'meal-location' },
            { native: 'The restaurant is expensive.', target: '这家餐厅很贵。', words: ['这家', '餐厅', '很', '贵', '。'], difficulty: 'beginner', pattern: 'restaurant-price' },
            { native: 'I do not eat meat.', target: '我不吃肉。', words: ['我', '不', '吃', '肉', '。'], difficulty: 'beginner', pattern: 'dietary-restriction' },
            { native: 'Please bring the menu.', target: '请拿菜单来。', words: ['请', '拿', '菜单', '来', '。'], difficulty: 'beginner', pattern: 'menu-request' },
            
            // Intermediate sentences
            { native: 'What would you recommend from this menu?', target: '你推荐这个菜单上的什么菜？', words: ['你', '推荐', '这个', '菜单', '上的', '什么', '菜', '？'], difficulty: 'intermediate', pattern: 'recommendation-request' },
            { native: 'This hotpot restaurant is always crowded on weekends.', target: '这家火锅店周末总是很拥挤。', words: ['这家', '火锅店', '周末', '总是', '很', '拥挤', '。'], difficulty: 'intermediate', pattern: 'restaurant-description' },
            { native: 'I would like to order the Peking duck, please.', target: '我想点北京烤鸭，谢谢。', words: ['我', '想', '点', '北京烤鸭', '，', '谢谢', '。'], difficulty: 'intermediate', pattern: 'specific-order' },
            { native: 'The chef prepared this dish with fresh ingredients.', target: '厨师用新鲜的食材做这道菜。', words: ['厨师', '用', '新鲜的', '食材', '做', '这道', '菜', '。'], difficulty: 'intermediate', pattern: 'cooking-method' },
            
            // Advanced sentences
            { native: 'The authentic Sichuan cuisine here has the perfect balance of spicy and numbing flavors.', target: '这里正宗的川菜有完美的麻辣平衡。', words: ['这里', '正宗的', '川菜', '有', '完美的', '麻辣', '平衡', '。'], difficulty: 'advanced', pattern: 'cuisine-analysis' },
            { native: 'After trying many restaurants, I believe this place serves the best dumplings in the city.', target: '尝试了很多餐厅后，我认为这里的饺子是城里最好的。', words: ['尝试了', '很多', '餐厅', '后', '，', '我', '认为', '这里的', '饺子', '是', '城里', '最好的', '。'], difficulty: 'advanced', pattern: 'comparison-conclusion' }
          ],
          newVocabulary: [
            { target: '喜欢', native: 'to like', pronunciation: 'xǐ huan', difficulty: 1 },
            { target: '吃', native: 'to eat', pronunciation: 'chī', difficulty: 1 },
            { target: '米饭', native: 'rice', pronunciation: 'mǐ fàn', difficulty: 1 },
            { target: '菜', native: 'food/dish', pronunciation: 'cài', difficulty: 1 },
            { target: '好吃', native: 'delicious', pronunciation: 'hǎo chī', difficulty: 1 },
            { target: '一些', native: 'some', pronunciation: 'yī xiē', difficulty: 1 },
            { target: '水', native: 'water', pronunciation: 'shuǐ', difficulty: 1 },
            { target: '在家', native: 'at home', pronunciation: 'zài jiā', difficulty: 1 },
            { target: '早餐', native: 'breakfast', pronunciation: 'zǎo cān', difficulty: 2 },
            { target: '这家', native: 'this (restaurant/store)', pronunciation: 'zhè jiā', difficulty: 1 },
            { target: '餐厅', native: 'restaurant', pronunciation: 'cān tīng', difficulty: 2 },
            { target: '贵', native: 'expensive', pronunciation: 'guì', difficulty: 1 },
            { target: '肉', native: 'meat', pronunciation: 'ròu', difficulty: 1 },
            { target: '拿', native: 'to take/bring', pronunciation: 'ná', difficulty: 1 },
            { target: '菜单', native: 'menu', pronunciation: 'cài dān', difficulty: 2 },
            { target: '来', native: 'to come', pronunciation: 'lái', difficulty: 1 },
            { target: '推荐', native: 'to recommend', pronunciation: 'tuī jiàn', difficulty: 2 },
            { target: '上的', native: 'on (the)', pronunciation: 'shàng de', difficulty: 2 },
            { target: '什么', native: 'what', pronunciation: 'shén me', difficulty: 1 },
            { target: '火锅店', native: 'hotpot restaurant', pronunciation: 'huǒ guō diàn', difficulty: 2 },
            { target: '周末', native: 'weekend', pronunciation: 'zhōu mò', difficulty: 2 },
            { target: '总是', native: 'always', pronunciation: 'zǒng shì', difficulty: 2 },
            { target: '拥挤', native: 'crowded', pronunciation: 'yōng jǐ', difficulty: 2 },
            { target: '点', native: 'to order', pronunciation: 'diǎn', difficulty: 2 },
            { target: '北京烤鸭', native: 'Peking duck', pronunciation: 'běi jīng kǎo yā', difficulty: 3 },
            { target: '厨师', native: 'chef', pronunciation: 'chú shī', difficulty: 2 },
            { target: '新鲜的', native: 'fresh', pronunciation: 'xīn xiān de', difficulty: 2 },
            { target: '食材', native: 'ingredients', pronunciation: 'shí cái', difficulty: 2 },
            { target: '做', native: 'to make/cook', pronunciation: 'zuò', difficulty: 1 },
            { target: '这道', native: 'this (dish)', pronunciation: 'zhè dào', difficulty: 2 }
          ]
        },

        'Shopping & Money': {
          sentences: [
            // Beginner sentences
            { native: 'How much does this cost?', target: '这个多少钱？', words: ['这个', '多少', '钱', '？'], difficulty: 'beginner', pattern: 'price-inquiry' },
            { native: 'I want to buy clothes.', target: '我想买衣服。', words: ['我', '想', '买', '衣服', '。'], difficulty: 'beginner', pattern: 'shopping-intention' },
            { native: 'The store is closed.', target: '商店关门了。', words: ['商店', '关门', '了', '。'], difficulty: 'beginner', pattern: 'store-status' },
            { native: 'Do you accept credit cards?', target: '你们收信用卡吗？', words: ['你们', '收', '信用卡', '吗', '？'], difficulty: 'beginner', pattern: 'payment-method' },
            { native: 'This is too expensive.', target: '这太贵了。', words: ['这', '太', '贵', '了', '。'], difficulty: 'beginner', pattern: 'price-complaint' },
            { native: 'I need a receipt.', target: '我需要收据。', words: ['我', '需要', '收据', '。'], difficulty: 'beginner', pattern: 'receipt-request' },
            
            // Intermediate sentences
            { native: 'Can you give me a discount on this item?', target: '你能给我这件商品打折吗？', words: ['你', '能', '给我', '这件', '商品', '打折', '吗', '？'], difficulty: 'intermediate', pattern: 'discount-request' },
            { native: 'I would like to return this because it does not fit.', target: '我想退这个，因为不合适。', words: ['我', '想', '退', '这个', '，', '因为', '不', '合适', '。'], difficulty: 'intermediate', pattern: 'return-reason' },
            { native: 'The shopping mall has a big sale this weekend.', target: '购物中心这个周末有大减价。', words: ['购物中心', '这个', '周末', '有', '大', '减价', '。'], difficulty: 'intermediate', pattern: 'sale-announcement' },
            
            // Advanced sentences
            { native: 'I have been comparing prices at different stores before making this purchase.', target: '我在买之前比较了不同商店的价格。', words: ['我', '在', '买', '之前', '比较了', '不同', '商店的', '价格', '。'], difficulty: 'advanced', pattern: 'price-comparison' }
          ],
          newVocabulary: [
            { target: '钱', native: 'money', pronunciation: 'qián', difficulty: 1 },
            { target: '买', native: 'to buy', pronunciation: 'mǎi', difficulty: 1 },
            { target: '衣服', native: 'clothes', pronunciation: 'yī fu', difficulty: 1 },
            { target: '商店', native: 'store', pronunciation: 'shāng diàn', difficulty: 1 },
            { target: '关门', native: 'to close', pronunciation: 'guān mén', difficulty: 2 },
            { target: '你们', native: 'you (plural)', pronunciation: 'nǐ men', difficulty: 1 },
            { target: '收', native: 'to accept/receive', pronunciation: 'shōu', difficulty: 2 },
            { target: '信用卡', native: 'credit card', pronunciation: 'xìn yòng kǎ', difficulty: 2 },
            { target: '太', native: 'too (much)', pronunciation: 'tài', difficulty: 1 },
            { target: '需要', native: 'to need', pronunciation: 'xū yào', difficulty: 2 },
            { target: '收据', native: 'receipt', pronunciation: 'shōu jù', difficulty: 2 },
            { target: '给我', native: 'give me', pronunciation: 'gěi wǒ', difficulty: 1 },
            { target: '这件', native: 'this (item)', pronunciation: 'zhè jiàn', difficulty: 1 },
            { target: '商品', native: 'product/item', pronunciation: 'shāng pǐn', difficulty: 2 },
            { target: '打折', native: 'to give discount', pronunciation: 'dǎ zhé', difficulty: 2 },
            { target: '退', native: 'to return', pronunciation: 'tuì', difficulty: 2 },
            { target: '因为', native: 'because', pronunciation: 'yīn wèi', difficulty: 2 },
            { target: '合适', native: 'suitable/fit', pronunciation: 'hé shì', difficulty: 2 },
            { target: '购物中心', native: 'shopping mall', pronunciation: 'gòu wù zhōng xīn', difficulty: 2 },
            { target: '大', native: 'big', pronunciation: 'dà', difficulty: 1 },
            { target: '减价', native: 'price reduction', pronunciation: 'jiǎn jià', difficulty: 2 }
          ]
        },

        'Transportation': {
          sentences: [
            // Beginner sentences
            { native: 'I take the bus to work.', target: '我坐公交车上班。', words: ['我', '坐', '公交车', '上班', '。'], difficulty: 'beginner', pattern: 'transport-work' },
            { native: 'The taxi is coming soon.', target: '出租车马上就到。', words: ['出租车', '马上', '就', '到', '。'], difficulty: 'beginner', pattern: 'transport-arrival' },
            { native: 'Where is the subway station?', target: '地铁站在哪里？', words: ['地铁站', '在', '哪里', '？'], difficulty: 'beginner', pattern: 'location-inquiry' },
            { native: 'I want to go to the airport.', target: '我想去机场。', words: ['我', '想', '去', '机场', '。'], difficulty: 'beginner', pattern: 'destination-declaration' },
            { native: 'The train is very fast.', target: '火车很快。', words: ['火车', '很', '快', '。'], difficulty: 'beginner', pattern: 'transport-speed' },
            
            // Intermediate sentences
            { native: 'How long does it take to get to downtown by subway?', target: '坐地铁到市中心要多长时间？', words: ['坐', '地铁', '到', '市中心', '要', '多长', '时间', '？'], difficulty: 'intermediate', pattern: 'travel-time-inquiry' },
            { native: 'The bus was delayed because of heavy traffic.', target: '公交车因为交通拥堵而延误了。', words: ['公交车', '因为', '交通', '拥堵', '而', '延误', '了', '。'], difficulty: 'intermediate', pattern: 'delay-explanation' },
            { native: 'I prefer riding my bicycle to driving a car in the city.', target: '在城市里我宁愿骑自行车也不开车。', words: ['在', '城市', '里', '我', '宁愿', '骑', '自行车', '也不', '开车', '。'], difficulty: 'intermediate', pattern: 'transport-preference' },
            
            // Advanced sentences
            { native: 'The new high-speed rail line has significantly reduced travel time between these two cities.', target: '新的高铁线路大大缩短了这两个城市之间的旅行时间。', words: ['新的', '高铁', '线路', '大大', '缩短了', '这', '两个', '城市', '之间的', '旅行', '时间', '。'], difficulty: 'advanced', pattern: 'infrastructure-impact' }
          ],
          newVocabulary: [
            { target: '坐', native: 'to sit/take (transport)', pronunciation: 'zuò', difficulty: 1 },
            { target: '公交车', native: 'bus', pronunciation: 'gōng jiāo chē', difficulty: 2 },
            { target: '上班', native: 'to go to work', pronunciation: 'shàng bān', difficulty: 2 },
            { target: '出租车', native: 'taxi', pronunciation: 'chū zū chē', difficulty: 2 },
            { target: '马上', native: 'immediately', pronunciation: 'mǎ shàng', difficulty: 2 },
            { target: '就', native: 'then/just', pronunciation: 'jiù', difficulty: 1 },
            { target: '到', native: 'to arrive', pronunciation: 'dào', difficulty: 1 },
            { target: '地铁站', native: 'subway station', pronunciation: 'dì tiě zhàn', difficulty: 2 },
            { target: '在', native: 'at/in', pronunciation: 'zài', difficulty: 1 },
            { target: '去', native: 'to go', pronunciation: 'qù', difficulty: 1 },
            { target: '机场', native: 'airport', pronunciation: 'jī chǎng', difficulty: 2 },
            { target: '火车', native: 'train', pronunciation: 'huǒ chē', difficulty: 2 },
            { target: '快', native: 'fast', pronunciation: 'kuài', difficulty: 1 },
            { target: '地铁', native: 'subway', pronunciation: 'dì tiě', difficulty: 2 },
            { target: '市中心', native: 'downtown', pronunciation: 'shì zhōng xīn', difficulty: 2 },
            { target: '多长', native: 'how long', pronunciation: 'duō cháng', difficulty: 2 },
            { target: '时间', native: 'time', pronunciation: 'shí jiān', difficulty: 2 },
            { target: '交通', native: 'traffic', pronunciation: 'jiāo tōng', difficulty: 2 },
            { target: '拥堵', native: 'traffic jam', pronunciation: 'yōng dǔ', difficulty: 3 },
            { target: '而', native: 'and/but', pronunciation: 'ér', difficulty: 2 },
            { target: '延误', native: 'delay', pronunciation: 'yán wù', difficulty: 3 },
            { target: '城市', native: 'city', pronunciation: 'chéng shì', difficulty: 2 },
            { target: '里', native: 'inside', pronunciation: 'lǐ', difficulty: 1 },
            { target: '宁愿', native: 'would rather', pronunciation: 'nìng yuàn', difficulty: 3 },
            { target: '骑', native: 'to ride', pronunciation: 'qí', difficulty: 2 },
            { target: '自行车', native: 'bicycle', pronunciation: 'zì xíng chē', difficulty: 2 },
            { target: '也不', native: 'rather than', pronunciation: 'yě bù', difficulty: 2 },
            { target: '开车', native: 'to drive', pronunciation: 'kāi chē', difficulty: 2 }
          ]
        },

        'Work & School': {
          sentences: [
            // Beginner sentences
            { native: 'I am a student.', target: '我是学生。', words: ['我', '是', '学生', '。'], difficulty: 'beginner', pattern: 'identity-statement' },
            { native: 'My teacher is very patient.', target: '我的老师很有耐心。', words: ['我的', '老师', '很', '有', '耐心', '。'], difficulty: 'beginner', pattern: 'teacher-description' },
            { native: 'I have homework tonight.', target: '我今晚有作业。', words: ['我', '今晚', '有', '作业', '。'], difficulty: 'beginner', pattern: 'homework-statement' },
            { native: 'The office is busy today.', target: '办公室今天很忙。', words: ['办公室', '今天', '很', '忙', '。'], difficulty: 'beginner', pattern: 'workplace-condition' },
            { native: 'I work for a big company.', target: '我在一家大公司工作。', words: ['我', '在', '一家', '大公司', '工作', '。'], difficulty: 'beginner', pattern: 'employment-statement' },
            
            // Intermediate sentences
            { native: 'My colleague and I are working on an important project together.', target: '我和同事一起做一个重要项目。', words: ['我', '和', '同事', '一起', '做', '一个', '重要', '项目', '。'], difficulty: 'intermediate', pattern: 'collaborative-work' },
            { native: 'The university library is open until midnight during exam period.', target: '考试期间大学图书馆开到午夜。', words: ['考试', '期间', '大学', '图书馆', '开到', '午夜', '。'], difficulty: 'intermediate', pattern: 'academic-schedule' },
            { native: 'I received a promotion at work last month.', target: '我上个月在工作中得到了升职。', words: ['我', '上个月', '在', '工作', '中', '得到了', '升职', '。'], difficulty: 'intermediate', pattern: 'career-advancement' },
            
            // Advanced sentences
            { native: 'After graduating with honors, she was immediately hired by a prestigious consulting firm.', target: '她以优异成绩毕业后，立即被一家知名咨询公司录用了。', words: ['她', '以', '优异', '成绩', '毕业', '后', '，', '立即', '被', '一家', '知名', '咨询', '公司', '录用', '了', '。'], difficulty: 'advanced', pattern: 'career-success' }
          ],
          newVocabulary: [
            { target: '学生', native: 'student', pronunciation: 'xué sheng', difficulty: 1 },
            { target: '老师', native: 'teacher', pronunciation: 'lǎo shī', difficulty: 1 },
            { target: '耐心', native: 'patience', pronunciation: 'nài xīn', difficulty: 2 },
            { target: '今晚', native: 'tonight', pronunciation: 'jīn wǎn', difficulty: 2 },
            { target: '作业', native: 'homework', pronunciation: 'zuò yè', difficulty: 2 },
            { target: '办公室', native: 'office', pronunciation: 'bàn gōng shì', difficulty: 2 },
            { target: '今天', native: 'today', pronunciation: 'jīn tiān', difficulty: 1 },
            { target: '忙', native: 'busy', pronunciation: 'máng', difficulty: 1 },
            { target: '一家', native: 'a/one (company)', pronunciation: 'yī jiā', difficulty: 1 },
            { target: '大公司', native: 'big company', pronunciation: 'dà gōng sī', difficulty: 2 },
            { target: '同事', native: 'colleague', pronunciation: 'tóng shì', difficulty: 2 },
            { target: '一个', native: 'one/a', pronunciation: 'yī ge', difficulty: 1 },
            { target: '重要', native: 'important', pronunciation: 'zhòng yào', difficulty: 2 },
            { target: '项目', native: 'project', pronunciation: 'xiàng mù', difficulty: 2 },
            { target: '考试', native: 'exam', pronunciation: 'kǎo shì', difficulty: 2 },
            { target: '期间', native: 'period/during', pronunciation: 'qī jiān', difficulty: 2 },
            { target: '图书馆', native: 'library', pronunciation: 'tú shū guǎn', difficulty: 2 },
            { target: '开到', native: 'open until', pronunciation: 'kāi dào', difficulty: 2 },
            { target: '午夜', native: 'midnight', pronunciation: 'wǔ yè', difficulty: 2 },
            { target: '上个月', native: 'last month', pronunciation: 'shàng ge yuè', difficulty: 2 },
            { target: '中', native: 'in/within', pronunciation: 'zhōng', difficulty: 1 },
            { target: '得到了', native: 'received', pronunciation: 'dé dào le', difficulty: 2 },
            { target: '升职', native: 'promotion', pronunciation: 'shēng zhí', difficulty: 3 }
          ]
        },

        'Health & Body': {
          sentences: [
            // Beginner sentences
            { native: 'I feel sick today.', target: '我今天感觉不舒服。', words: ['我', '今天', '感觉', '不舒服', '。'], difficulty: 'beginner', pattern: 'illness-statement' },
            { native: 'My head hurts.', target: '我头疼。', words: ['我', '头疼', '。'], difficulty: 'beginner', pattern: 'pain-statement' },
            { native: 'I need to see a doctor.', target: '我需要看医生。', words: ['我', '需要', '看', '医生', '。'], difficulty: 'beginner', pattern: 'medical-need' },
            { native: 'Exercise is good for health.', target: '运动对健康有好处。', words: ['运动', '对', '健康', '有', '好处', '。'], difficulty: 'beginner', pattern: 'health-benefit' },
            { native: 'I brush my teeth every morning.', target: '我每天早上刷牙。', words: ['我', '每天', '早上', '刷牙', '。'], difficulty: 'beginner', pattern: 'hygiene-routine' },
            
            // Intermediate sentences
            { native: 'The doctor prescribed medicine for my cold.', target: '医生给我开了治感冒的药。', words: ['医生', '给', '我', '开了', '治', '感冒', '的', '药', '。'], difficulty: 'intermediate', pattern: 'medical-prescription' },
            { native: 'Regular exercise and healthy eating help prevent disease.', target: '定期运动和健康饮食有助于预防疾病。', words: ['定期', '运动', '和', '健康', '饮食', '有助于', '预防', '疾病', '。'], difficulty: 'intermediate', pattern: 'health-prevention' },
            { native: 'I have been feeling stressed lately due to work pressure.', target: '我最近因为工作压力感到压力很大。', words: ['我', '最近', '因为', '工作', '压力', '感到', '压力', '很大', '。'], difficulty: 'intermediate', pattern: 'stress-explanation' },
            
            // Advanced sentences
            { native: 'The comprehensive health checkup revealed that all my vital signs are within normal ranges.', target: '全面的健康检查显示我所有的生命体征都在正常范围内。', words: ['全面的', '健康', '检查', '显示', '我', '所有的', '生命', '体征', '都', '在', '正常', '范围', '内', '。'], difficulty: 'advanced', pattern: 'medical-results' }
          ],
          newVocabulary: [
            { target: '感觉', native: 'to feel', pronunciation: 'gǎn jué', difficulty: 2 },
            { target: '不舒服', native: 'uncomfortable/sick', pronunciation: 'bù shū fu', difficulty: 2 },
            { target: '头疼', native: 'headache', pronunciation: 'tóu téng', difficulty: 2 },
            { target: '看', native: 'to see', pronunciation: 'kàn', difficulty: 1 },
            { target: '医生', native: 'doctor', pronunciation: 'yī shēng', difficulty: 2 },
            { target: '运动', native: 'exercise', pronunciation: 'yùn dòng', difficulty: 2 },
            { target: '对', native: 'for/towards', pronunciation: 'duì', difficulty: 1 },
            { target: '好处', native: 'benefit', pronunciation: 'hǎo chu', difficulty: 2 },
            { target: '每天', native: 'every day', pronunciation: 'měi tiān', difficulty: 1 },
            { target: '早上', native: 'morning', pronunciation: 'zǎo shang', difficulty: 1 },
            { target: '刷牙', native: 'brush teeth', pronunciation: 'shuā yá', difficulty: 2 },
            { target: '给', native: 'to give', pronunciation: 'gěi', difficulty: 1 },
            { target: '开了', native: 'prescribed', pronunciation: 'kāi le', difficulty: 2 },
            { target: '治', native: 'to treat', pronunciation: 'zhì', difficulty: 2 },
            { target: '感冒', native: 'cold', pronunciation: 'gǎn mào', difficulty: 2 },
            { target: '药', native: 'medicine', pronunciation: 'yào', difficulty: 2 },
            { target: '定期', native: 'regular', pronunciation: 'dìng qī', difficulty: 2 },
            { target: '饮食', native: 'diet', pronunciation: 'yǐn shí', difficulty: 2 },
            { target: '有助于', native: 'helps with', pronunciation: 'yǒu zhù yú', difficulty: 3 },
            { target: '预防', native: 'prevent', pronunciation: 'yù fáng', difficulty: 3 },
            { target: '疾病', native: 'disease', pronunciation: 'jí bìng', difficulty: 3 },
            { target: '最近', native: 'recently', pronunciation: 'zuì jìn', difficulty: 2 },
            { target: '压力', native: 'pressure/stress', pronunciation: 'yā lì', difficulty: 2 },
            { target: '感到', native: 'to feel', pronunciation: 'gǎn dào', difficulty: 2 },
            { target: '很大', native: 'very big/much', pronunciation: 'hěn dà', difficulty: 1 }
          ]
        },

        'Weather & Time': {
          sentences: [
            // Beginner sentences
            { native: 'Today is sunny.', target: '今天是晴天。', words: ['今天', '是', '晴天', '。'], difficulty: 'beginner', pattern: 'weather-description' },
            { native: 'It is raining outside.', target: '外面在下雨。', words: ['外面', '在', '下雨', '。'], difficulty: 'beginner', pattern: 'current-weather' },
            { native: 'What time is it now?', target: '现在几点了？', words: ['现在', '几点', '了', '？'], difficulty: 'beginner', pattern: 'time-inquiry' },
            { native: 'Winter is very cold.', target: '冬天很冷。', words: ['冬天', '很', '冷', '。'], difficulty: 'beginner', pattern: 'seasonal-temperature' },
            { native: 'I wake up at seven.', target: '我七点起床。', words: ['我', '七点', '起床', '。'], difficulty: 'beginner', pattern: 'daily-routine' },
            
            // Intermediate sentences
            { native: 'The weather forecast says it will be cloudy tomorrow.', target: '天气预报说明天会是阴天。', words: ['天气预报', '说', '明天', '会', '是', '阴天', '。'], difficulty: 'intermediate', pattern: 'weather-prediction' },
            { native: 'Spring is my favorite season because flowers bloom everywhere.', target: '春天是我最喜欢的季节，因为到处都开花。', words: ['春天', '是', '我', '最喜欢的', '季节', '，', '因为', '到处', '都', '开花', '。'], difficulty: 'intermediate', pattern: 'seasonal-preference' },
            { native: 'I usually go jogging in the morning when the air is fresh.', target: '我通常在空气新鲜的早晨去慢跑。', words: ['我', '通常', '在', '空气', '新鲜的', '早晨', '去', '慢跑', '。'], difficulty: 'intermediate', pattern: 'activity-timing' },
            
            // Advanced sentences
            { native: 'The meteorologist predicted that the typhoon would make landfall sometime during the weekend.', target: '气象学家预测台风将在周末某个时候登陆。', words: ['气象学家', '预测', '台风', '将', '在', '周末', '某个', '时候', '登陆', '。'], difficulty: 'advanced', pattern: 'weather-prediction-formal' }
          ],
          newVocabulary: [
            { target: '晴天', native: 'sunny day', pronunciation: 'qíng tiān', difficulty: 1 },
            { target: '外面', native: 'outside', pronunciation: 'wài miàn', difficulty: 1 },
            { target: '下雨', native: 'to rain', pronunciation: 'xià yǔ', difficulty: 1 },
            { target: '现在', native: 'now', pronunciation: 'xiàn zài', difficulty: 1 },
            { target: '几点', native: 'what time', pronunciation: 'jǐ diǎn', difficulty: 1 },
            { target: '冬天', native: 'winter', pronunciation: 'dōng tiān', difficulty: 1 },
            { target: '冷', native: 'cold', pronunciation: 'lěng', difficulty: 1 },
            { target: '七点', native: 'seven o\'clock', pronunciation: 'qī diǎn', difficulty: 1 },
            { target: '起床', native: 'to get up', pronunciation: 'qǐ chuáng', difficulty: 2 },
            { target: '天气预报', native: 'weather forecast', pronunciation: 'tiān qì yù bào', difficulty: 2 },
            { target: '会', native: 'will', pronunciation: 'huì', difficulty: 1 },
            { target: '阴天', native: 'cloudy day', pronunciation: 'yīn tiān', difficulty: 2 },
            { target: '春天', native: 'spring', pronunciation: 'chūn tiān', difficulty: 1 },
            { target: '最喜欢的', native: 'favorite', pronunciation: 'zuì xǐ huan de', difficulty: 2 },
            { target: '季节', native: 'season', pronunciation: 'jì jié', difficulty: 2 },
            { target: '到处', native: 'everywhere', pronunciation: 'dào chù', difficulty: 2 },
            { target: '开花', native: 'to bloom', pronunciation: 'kāi huā', difficulty: 2 },
            { target: '通常', native: 'usually', pronunciation: 'tōng cháng', difficulty: 2 },
            { target: '空气', native: 'air', pronunciation: 'kōng qì', difficulty: 2 },
            { target: '新鲜的', native: 'fresh', pronunciation: 'xīn xiān de', difficulty: 2 },
            { target: '慢跑', native: 'to jog', pronunciation: 'màn pǎo', difficulty: 2 },
            { target: '气象学家', native: 'meteorologist', pronunciation: 'qì xiàng xué jiā', difficulty: 3 },
            { target: '预测', native: 'to predict', pronunciation: 'yù cè', difficulty: 3 },
            { target: '台风', native: 'typhoon', pronunciation: 'tái fēng', difficulty: 3 },
            { target: '将', native: 'will (formal)', pronunciation: 'jiāng', difficulty: 2 },
            { target: '某个', native: 'some/a certain', pronunciation: 'mǒu ge', difficulty: 2 },
            { target: '时候', native: 'time', pronunciation: 'shí hou', difficulty: 2 },
            { target: '登陆', native: 'to make landfall', pronunciation: 'dēng lù', difficulty: 3 }
          ]
        }
      };

      // Process each category
      const sentences = [];
      const vocabularies = [];
      
      for (const [categoryName, data] of Object.entries(sentenceData)) {
        const categoryId = categoryMap[categoryName];
        if (!categoryId) {
          console.log(`Warning: Category "${categoryName}" not found`);
          continue;
        }

        console.log(`Processing ${categoryName}...`);

        // Add new vocabulary for this category
        data.newVocabulary.forEach(vocab => {
          const vocabKey = `${vocab.target}-${vocab.native}-${categoryId}`;
          if (!existingVocabSet.has(vocabKey)) {
            vocabularies.push({
              id: uuidv4(),
              categoryId: categoryId,
              nativeWord: vocab.native,
              targetWord: vocab.target,
              pronunciation: vocab.pronunciation,
              difficulty: vocab.difficulty,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            existingVocabSet.add(vocabKey);
          }
        });

        // Create sentences for this category
        data.sentences.forEach(sentence => {
          // Create vocabulary mapping for sentence
          const vocabularyIds = [];
          const wordPositions = [];
          
          sentence.words.forEach((word, index) => {
            // Find corresponding vocabulary ID
            const vocab = data.newVocabulary.find(v => v.target === word);
            if (vocab) {
              const existingVocab = vocabularies.find(v => v.targetWord === word && v.categoryId === categoryId);
              if (existingVocab) {
                vocabularyIds.push(existingVocab.id);
                wordPositions.push({ position: index, vocabularyId: existingVocab.id });
              }
            }
          });

          sentences.push({
            id: uuidv4(),
            categoryId: categoryId,
            nativeText: sentence.native,
            targetText: sentence.target,
            vocabularyIds: JSON.stringify(vocabularyIds),
            wordPositions: JSON.stringify(wordPositions),
            difficulty: sentence.difficulty,
            sentenceLength: sentence.words.length,
            grammarPattern: sentence.pattern,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }

      // Insert vocabulary first
      if (vocabularies.length > 0) {
        await queryInterface.bulkInsert('Vocabularies', vocabularies, { transaction });
        console.log(`Inserted ${vocabularies.length} new vocabulary items`);
      }

      // Now query the database to get actual vocabulary IDs for sentence mapping
      // Get category IDs for mandarin categories (just the IDs, not the full objects)
      const categoryIds = Object.values(categories).map(cat => cat.id || cat);
      const [insertedVocabularies] = await queryInterface.sequelize.query(
        'SELECT v.id, v."targetWord", v."categoryId" FROM "Vocabularies" v WHERE v."categoryId" = ANY(:categoryIds)',
        {
          replacements: { categoryIds },
          type: queryInterface.sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      // Recreate sentences with proper vocabulary mapping
      const sentencesWithVocab = [];
      
      for (const sentence of data.sentences) {
        const categoryId = categories[sentence.category];
        if (!categoryId) {
          console.log(`Category ${sentence.category} not found, skipping sentence`);
          continue;
        }

        const vocabularyIds = [];
        const wordPositions = [];

        // Map each word in the sentence to vocabulary IDs
        sentence.words.forEach((word, index) => {
          // Find corresponding vocabulary ID from inserted vocabulary
          const vocab = insertedVocabularies.find(v => v.targetWord === word && v.categoryId === categoryId);
          if (vocab) {
            vocabularyIds.push(vocab.id);
            wordPositions.push({ position: index, vocabularyId: vocab.id });
          }
        });

        sentencesWithVocab.push({
          id: uuidv4(),
          categoryId,
          nativeText: sentence.native,
          targetText: sentence.target,
          difficulty: sentence.difficulty,
          vocabularyIds: JSON.stringify(vocabularyIds),
          wordPositions: JSON.stringify(wordPositions),
          sentenceLength: sentence.target.length,
          language: 'mandarin',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Insert sentences with proper vocabulary mapping
      if (sentencesWithVocab.length > 0) {
        await queryInterface.bulkInsert('Sentences', sentencesWithVocab, { transaction });
        console.log(`Inserted ${sentencesWithVocab.length} sentences with vocabulary mapping`);
      }

      await transaction.commit();
      console.log('Mandarin sentences seeding completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating Mandarin sentences:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Delete sentences created by this seeder
      await queryInterface.sequelize.query(`
        DELETE FROM "Sentences" 
        WHERE "createdAt" >= '2025-07-13'
      `, { transaction });
      
      // Delete vocabulary created by this seeder
      await queryInterface.sequelize.query(`
        DELETE FROM "Vocabularies" 
        WHERE "createdAt" >= '2025-07-13'
      `, { transaction });
      
      await transaction.commit();
      console.log('Mandarin sentences rollback completed');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};