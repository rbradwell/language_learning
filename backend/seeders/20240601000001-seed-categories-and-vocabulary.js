// seeders/20240601000001-seed-categories-and-vocabulary.js
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Create Categories for Mandarin
      const mandarinCategories = [
        {
          id: uuidv4(),
          name: 'Greetings & Basic Interactions',
          description: 'Essential phrases for meeting people and basic social interactions',
          language: 'Mandarin',
          difficulty: 1,
          iconPath: 'Greetings',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Family & Relationships',
          description: 'Words for family members and describing relationships',
          language: 'Mandarin',
          difficulty: 1,
          iconPath: 'FamilyAndRelationships',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Food & Dining',
          description: 'Restaurant vocabulary, food items, and dining experiences',
          language: 'Mandarin',
          difficulty: 2,
          iconPath: 'FoodAndDining',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Shopping & Money',
          description: 'Shopping vocabulary, prices, and commercial transactions',
          language: 'Mandarin',
          difficulty: 2,
          iconPath: 'ShoppingAndMoney',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Transportation',
          description: 'Getting around the city, vehicles, and travel',
          language: 'Mandarin',
          difficulty: 2,
          iconPath: 'Transport',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Work & School',
          description: 'Professional and educational vocabulary',
          language: 'Mandarin',
          difficulty: 3,
          iconPath: 'WorkAndSchool',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Health & Body',
          description: 'Medical vocabulary and body parts',
          language: 'Mandarin',
          difficulty: 3,
          iconPath: 'HealthAndBody',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Weather & Time',
          description: 'Weather conditions, seasons, and time expressions',
          language: 'Mandarin',
          difficulty: 2,
          iconPath: 'WeatherAndTime',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Create Categories for Portuguese
      const portugueseCategories = [
        {
          id: uuidv4(),
          name: 'Greetings & Basic Interactions',
          description: 'Essential phrases for meeting people and basic social interactions',
          language: 'Portuguese',
          difficulty: 1,
          iconPath: 'Greetings',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Family & Relationships',
          description: 'Words for family members and describing relationships',
          language: 'Portuguese',
          difficulty: 1,
          iconPath: 'FamilyAndRelationships',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Food & Dining',
          description: 'Restaurant vocabulary, food items, and dining experiences',
          language: 'Portuguese',
          difficulty: 2,
          iconPath: 'FoodAndDining',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Shopping & Money',
          description: 'Shopping vocabulary, prices, and commercial transactions',
          language: 'Portuguese',
          difficulty: 2,
          iconPath: 'ShoppingAndMoney',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Transportation',
          description: 'Getting around the city, vehicles, and travel',
          language: 'Portuguese',
          difficulty: 2,
          iconPath: 'Transport',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Work & School',
          description: 'Professional and educational vocabulary',
          language: 'Portuguese',
          difficulty: 3,
          iconPath: 'WorkAndSchool',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Health & Body',
          description: 'Medical vocabulary and body parts',
          language: 'Portuguese',
          difficulty: 3,
          iconPath: 'HealthAndBody',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Weather & Time',
          description: 'Weather conditions, seasons, and time expressions',
          language: 'Portuguese',
          difficulty: 2,
          iconPath: 'WeatherAndTime',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await queryInterface.bulkInsert('Categories', [...mandarinCategories, ...portugueseCategories], { transaction });

      // MANDARIN VOCABULARY
      const mandarinVocabulary = [];

      // Greetings & Basic Interactions - Mandarin
      const greetingsMandarin = [
        { nativeWord: 'Hello', targetWord: '你好', pronunciation: 'nǐ hǎo', difficulty: 1 },
        { nativeWord: 'Goodbye', targetWord: '再见', pronunciation: 'zài jiàn', difficulty: 1 },
        { nativeWord: 'Thank you', targetWord: '谢谢', pronunciation: 'xiè xiè', difficulty: 1 },
        { nativeWord: 'Please', targetWord: '请', pronunciation: 'qǐng', difficulty: 1 },
        { nativeWord: 'Excuse me', targetWord: '不好意思', pronunciation: 'bù hǎo yì si', difficulty: 1 },
        { nativeWord: 'Sorry', targetWord: '对不起', pronunciation: 'duì bu qǐ', difficulty: 1 },
        { nativeWord: 'Yes', targetWord: '是', pronunciation: 'shì', difficulty: 1 },
        { nativeWord: 'No', targetWord: '不是', pronunciation: 'bù shì', difficulty: 1 },
        { nativeWord: 'Good morning', targetWord: '早上好', pronunciation: 'zǎo shang hǎo', difficulty: 1 },
        { nativeWord: 'Good evening', targetWord: '晚上好', pronunciation: 'wǎn shang hǎo', difficulty: 1 },
        { nativeWord: 'How are you?', targetWord: '你好吗?', pronunciation: 'nǐ hǎo ma?', difficulty: 2 },
        { nativeWord: 'My name is', targetWord: '我叫', pronunciation: 'wǒ jiào', difficulty: 2 },
        { nativeWord: 'Nice to meet you', targetWord: '很高兴认识你', pronunciation: 'hěn gāo xìng rèn shi nǐ', difficulty: 2 },
        { nativeWord: 'See you later', targetWord: '回头见', pronunciation: 'huí tóu jiàn', difficulty: 2 },
        { nativeWord: 'You\'re welcome', targetWord: '不客气', pronunciation: 'bù kè qi', difficulty: 2 }
      ];

      // Family & Relationships - Mandarin
      const familyMandarin = [
        { nativeWord: 'Family', targetWord: '家庭', pronunciation: 'jiā tíng', difficulty: 1 },
        { nativeWord: 'Father', targetWord: '爸爸', pronunciation: 'bà ba', difficulty: 1 },
        { nativeWord: 'Mother', targetWord: '妈妈', pronunciation: 'mā ma', difficulty: 1 },
        { nativeWord: 'Son', targetWord: '儿子', pronunciation: 'ér zi', difficulty: 1 },
        { nativeWord: 'Daughter', targetWord: '女儿', pronunciation: 'nǚ ér', difficulty: 1 },
        { nativeWord: 'Older brother', targetWord: '哥哥', pronunciation: 'gē ge', difficulty: 1 },
        { nativeWord: 'Younger brother', targetWord: '弟弟', pronunciation: 'dì di', difficulty: 1 },
        { nativeWord: 'Older sister', targetWord: '姐姐', pronunciation: 'jiě jie', difficulty: 1 },
        { nativeWord: 'Younger sister', targetWord: '妹妹', pronunciation: 'mèi mei', difficulty: 1 },
        { nativeWord: 'Grandfather', targetWord: '爷爷', pronunciation: 'yé ye', difficulty: 1 },
        { nativeWord: 'Grandmother', targetWord: '奶奶', pronunciation: 'nǎi nai', difficulty: 1 },
        { nativeWord: 'Husband', targetWord: '丈夫', pronunciation: 'zhàng fu', difficulty: 2 },
        { nativeWord: 'Wife', targetWord: '妻子', pronunciation: 'qī zi', difficulty: 2 },
        { nativeWord: 'Friend', targetWord: '朋友', pronunciation: 'péng you', difficulty: 1 },
        { nativeWord: 'Boyfriend', targetWord: '男朋友', pronunciation: 'nán péng you', difficulty: 2 }
      ];

      // Food & Dining - Mandarin
      const foodMandarin = [
        { nativeWord: 'Food', targetWord: '食物', pronunciation: 'shí wù', difficulty: 1 },
        { nativeWord: 'Water', targetWord: '水', pronunciation: 'shuǐ', difficulty: 1 },
        { nativeWord: 'Rice', targetWord: '米饭', pronunciation: 'mǐ fàn', difficulty: 1 },
        { nativeWord: 'Noodles', targetWord: '面条', pronunciation: 'miàn tiáo', difficulty: 1 },
        { nativeWord: 'Meat', targetWord: '肉', pronunciation: 'ròu', difficulty: 1 },
        { nativeWord: 'Chicken', targetWord: '鸡肉', pronunciation: 'jī ròu', difficulty: 1 },
        { nativeWord: 'Fish', targetWord: '鱼', pronunciation: 'yú', difficulty: 1 },
        { nativeWord: 'Vegetable', targetWord: '蔬菜', pronunciation: 'shū cài', difficulty: 1 },
        { nativeWord: 'Fruit', targetWord: '水果', pronunciation: 'shuǐ guǒ', difficulty: 1 },
        { nativeWord: 'Apple', targetWord: '苹果', pronunciation: 'píng guǒ', difficulty: 1 },
        { nativeWord: 'Tea', targetWord: '茶', pronunciation: 'chá', difficulty: 1 },
        { nativeWord: 'Coffee', targetWord: '咖啡', pronunciation: 'kā fēi', difficulty: 1 },
        { nativeWord: 'Restaurant', targetWord: '餐厅', pronunciation: 'cān tīng', difficulty: 2 },
        { nativeWord: 'Menu', targetWord: '菜单', pronunciation: 'cài dān', difficulty: 2 },
        { nativeWord: 'Delicious', targetWord: '好吃', pronunciation: 'hǎo chī', difficulty: 2 },
        { nativeWord: 'Spicy', targetWord: '辣', pronunciation: 'là', difficulty: 2 },
        { nativeWord: 'Sweet', targetWord: '甜', pronunciation: 'tián', difficulty: 2 },
        { nativeWord: 'Bill/Check', targetWord: '账单', pronunciation: 'zhàng dān', difficulty: 2 }
      ];

      // Shopping & Money - Mandarin
      const shoppingMandarin = [
        { nativeWord: 'Money', targetWord: '钱', pronunciation: 'qián', difficulty: 1 },
        { nativeWord: 'Store', targetWord: '商店', pronunciation: 'shāng diàn', difficulty: 1 },
        { nativeWord: 'Buy', targetWord: '买', pronunciation: 'mǎi', difficulty: 1 },
        { nativeWord: 'Sell', targetWord: '卖', pronunciation: 'mài', difficulty: 1 },
        { nativeWord: 'Price', targetWord: '价格', pronunciation: 'jià gé', difficulty: 2 },
        { nativeWord: 'Cheap', targetWord: '便宜', pronunciation: 'pián yi', difficulty: 2 },
        { nativeWord: 'Expensive', targetWord: '贵', pronunciation: 'guì', difficulty: 2 },
        { nativeWord: 'How much?', targetWord: '多少钱?', pronunciation: 'duō shao qián?', difficulty: 2 },
        { nativeWord: 'Credit card', targetWord: '信用卡', pronunciation: 'xìn yòng kǎ', difficulty: 2 },
        { nativeWord: 'Cash', targetWord: '现金', pronunciation: 'xiàn jīn', difficulty: 2 },
        { nativeWord: 'Shopping', targetWord: '购物', pronunciation: 'gòu wù', difficulty: 2 },
        { nativeWord: 'Market', targetWord: '市场', pronunciation: 'shì chǎng', difficulty: 2 },
        { nativeWord: 'Clothes', targetWord: '衣服', pronunciation: 'yī fu', difficulty: 1 },
        { nativeWord: 'Shoes', targetWord: '鞋子', pronunciation: 'xié zi', difficulty: 1 },
        { nativeWord: 'Size', targetWord: '尺寸', pronunciation: 'chǐ cùn', difficulty: 2 }
      ];

      // Transportation - Mandarin
      const transportMandarin = [
        { nativeWord: 'Car', targetWord: '汽车', pronunciation: 'qì chē', difficulty: 1 },
        { nativeWord: 'Bus', targetWord: '公共汽车', pronunciation: 'gōng gòng qì chē', difficulty: 1 },
        { nativeWord: 'Taxi', targetWord: '出租车', pronunciation: 'chū zū chē', difficulty: 1 },
        { nativeWord: 'Train', targetWord: '火车', pronunciation: 'huǒ chē', difficulty: 1 },
        { nativeWord: 'Airplane', targetWord: '飞机', pronunciation: 'fēi jī', difficulty: 1 },
        { nativeWord: 'Bicycle', targetWord: '自行车', pronunciation: 'zì xíng chē', difficulty: 1 },
        { nativeWord: 'Subway', targetWord: '地铁', pronunciation: 'dì tiě', difficulty: 2 },
        { nativeWord: 'Airport', targetWord: '机场', pronunciation: 'jī chǎng', difficulty: 2 },
        { nativeWord: 'Station', targetWord: '车站', pronunciation: 'chē zhàn', difficulty: 2 },
        { nativeWord: 'Ticket', targetWord: '票', pronunciation: 'piào', difficulty: 2 },
        { nativeWord: 'Driver', targetWord: '司机', pronunciation: 'sī jī', difficulty: 2 },
        { nativeWord: 'Traffic', targetWord: '交通', pronunciation: 'jiāo tōng', difficulty: 2 },
        { nativeWord: 'Road', targetWord: '路', pronunciation: 'lù', difficulty: 1 },
        { nativeWord: 'Map', targetWord: '地图', pronunciation: 'dì tú', difficulty: 2 }
      ];

      // Work & School - Mandarin
      const workSchoolMandarin = [
        { nativeWord: 'Work', targetWord: '工作', pronunciation: 'gōng zuò', difficulty: 2 },
        { nativeWord: 'School', targetWord: '学校', pronunciation: 'xué xiào', difficulty: 1 },
        { nativeWord: 'Student', targetWord: '学生', pronunciation: 'xué sheng', difficulty: 1 },
        { nativeWord: 'Teacher', targetWord: '老师', pronunciation: 'lǎo shī', difficulty: 1 },
        { nativeWord: 'Book', targetWord: '书', pronunciation: 'shū', difficulty: 1 },
        { nativeWord: 'Study', targetWord: '学习', pronunciation: 'xué xí', difficulty: 2 },
        { nativeWord: 'Office', targetWord: '办公室', pronunciation: 'bàn gōng shì', difficulty: 2 },
        { nativeWord: 'Computer', targetWord: '电脑', pronunciation: 'diàn nǎo', difficulty: 2 },
        { nativeWord: 'Meeting', targetWord: '会议', pronunciation: 'huì yì', difficulty: 3 },
        { nativeWord: 'Boss', targetWord: '老板', pronunciation: 'lǎo bǎn', difficulty: 2 },
        { nativeWord: 'Colleague', targetWord: '同事', pronunciation: 'tóng shì', difficulty: 3 },
        { nativeWord: 'Job', targetWord: '工作', pronunciation: 'gōng zuò', difficulty: 2 },
        { nativeWord: 'Salary', targetWord: '工资', pronunciation: 'gōng zī', difficulty: 3 },
        { nativeWord: 'Experience', targetWord: '经验', pronunciation: 'jīng yàn', difficulty: 3 }
      ];

      // Health & Body - Mandarin
      const healthMandarin = [
        { nativeWord: 'Body', targetWord: '身体', pronunciation: 'shēn tǐ', difficulty: 2 },
        { nativeWord: 'Head', targetWord: '头', pronunciation: 'tóu', difficulty: 1 },
        { nativeWord: 'Eye', targetWord: '眼睛', pronunciation: 'yǎn jing', difficulty: 1 },
        { nativeWord: 'Nose', targetWord: '鼻子', pronunciation: 'bí zi', difficulty: 1 },
        { nativeWord: 'Mouth', targetWord: '嘴', pronunciation: 'zuǐ', difficulty: 1 },
        { nativeWord: 'Hand', targetWord: '手', pronunciation: 'shǒu', difficulty: 1 },
        { nativeWord: 'Foot', targetWord: '脚', pronunciation: 'jiǎo', difficulty: 1 },
        { nativeWord: 'Sick', targetWord: '生病', pronunciation: 'shēng bìng', difficulty: 2 },
        { nativeWord: 'Doctor', targetWord: '医生', pronunciation: 'yī sheng', difficulty: 2 },
        { nativeWord: 'Hospital', targetWord: '医院', pronunciation: 'yī yuán', difficulty: 2 },
        { nativeWord: 'Medicine', targetWord: '药', pronunciation: 'yào', difficulty: 2 },
        { nativeWord: 'Pain', targetWord: '疼', pronunciation: 'téng', difficulty: 2 },
        { nativeWord: 'Healthy', targetWord: '健康', pronunciation: 'jiàn kāng', difficulty: 2 }
      ];

      // Weather & Time - Mandarin
      const weatherTimeMandarin = [
        { nativeWord: 'Weather', targetWord: '天气', pronunciation: 'tiān qì', difficulty: 2 },
        { nativeWord: 'Hot', targetWord: '热', pronunciation: 'rè', difficulty: 1 },
        { nativeWord: 'Cold', targetWord: '冷', pronunciation: 'lěng', difficulty: 1 },
        { nativeWord: 'Rain', targetWord: '雨', pronunciation: 'yǔ', difficulty: 1 },
        { nativeWord: 'Sun', targetWord: '太阳', pronunciation: 'tài yáng', difficulty: 1 },
        { nativeWord: 'Snow', targetWord: '雪', pronunciation: 'xuě', difficulty: 1 },
        { nativeWord: 'Wind', targetWord: '风', pronunciation: 'fēng', difficulty: 1 },
        { nativeWord: 'Today', targetWord: '今天', pronunciation: 'jīn tiān', difficulty: 1 },
        { nativeWord: 'Tomorrow', targetWord: '明天', pronunciation: 'míng tiān', difficulty: 1 },
        { nativeWord: 'Yesterday', targetWord: '昨天', pronunciation: 'zuó tiān', difficulty: 1 },
        { nativeWord: 'Time', targetWord: '时间', pronunciation: 'shí jiān', difficulty: 2 },
        { nativeWord: 'Hour', targetWord: '小时', pronunciation: 'xiǎo shí', difficulty: 2 },
        { nativeWord: 'Minute', targetWord: '分钟', pronunciation: 'fēn zhōng', difficulty: 2 },
        { nativeWord: 'Week', targetWord: '星期', pronunciation: 'xīng qī', difficulty: 2 },
        { nativeWord: 'Month', targetWord: '月', pronunciation: 'yuè', difficulty: 1 },
        { nativeWord: 'Year', targetWord: '年', pronunciation: 'nián', difficulty: 1 }
      ];

      // Add vocabulary with category IDs
      const vocabularyData = [
        ...greetingsMandarin.map(v => ({ ...v, categoryId: mandarinCategories[0].id })),
        ...familyMandarin.map(v => ({ ...v, categoryId: mandarinCategories[1].id })),
        ...foodMandarin.map(v => ({ ...v, categoryId: mandarinCategories[2].id })),
        ...shoppingMandarin.map(v => ({ ...v, categoryId: mandarinCategories[3].id })),
        ...transportMandarin.map(v => ({ ...v, categoryId: mandarinCategories[4].id })),
        ...workSchoolMandarin.map(v => ({ ...v, categoryId: mandarinCategories[5].id })),
        ...healthMandarin.map(v => ({ ...v, categoryId: mandarinCategories[6].id })),
        ...weatherTimeMandarin.map(v => ({ ...v, categoryId: mandarinCategories[7].id }))
      ];

      // PORTUGUESE VOCABULARY
      // Greetings & Basic Interactions - Portuguese
      const greetingsPortuguese = [
        { nativeWord: 'Hello', targetWord: 'Olá', pronunciation: 'oh-LAH', difficulty: 1 },
        { nativeWord: 'Goodbye', targetWord: 'Tchau', pronunciation: 'chow', difficulty: 1 },
        { nativeWord: 'Thank you', targetWord: 'Obrigado/Obrigada', pronunciation: 'oh-bree-GAH-doo/dah', difficulty: 1 },
        { nativeWord: 'Please', targetWord: 'Por favor', pronunciation: 'por fah-VOR', difficulty: 1 },
        { nativeWord: 'Excuse me', targetWord: 'Com licença', pronunciation: 'kom lee-SEN-sah', difficulty: 1 },
        { nativeWord: 'Sorry', targetWord: 'Desculpa', pronunciation: 'des-KOOL-pah', difficulty: 1 },
        { nativeWord: 'Yes', targetWord: 'Sim', pronunciation: 'seen', difficulty: 1 },
        { nativeWord: 'No', targetWord: 'Não', pronunciation: 'now', difficulty: 1 },
        { nativeWord: 'Good morning', targetWord: 'Bom dia', pronunciation: 'bom DEE-ah', difficulty: 1 },
        { nativeWord: 'Good evening', targetWord: 'Boa noite', pronunciation: 'BOH-ah NOH-ee-teh', difficulty: 1 },
        { nativeWord: 'How are you?', targetWord: 'Como você está?', pronunciation: 'KOH-moo voh-SEH es-TAH', difficulty: 2 },
        { nativeWord: 'My name is', targetWord: 'Meu nome é', pronunciation: 'meh-oo NOH-meh eh', difficulty: 2 },
        { nativeWord: 'Nice to meet you', targetWord: 'Prazer em conhecê-lo', pronunciation: 'prah-ZER en ko-nyeh-SEH-loo', difficulty: 2 },
        { nativeWord: 'See you later', targetWord: 'Até logo', pronunciation: 'ah-TEH LOH-goo', difficulty: 2 },
        { nativeWord: 'You\'re welcome', targetWord: 'De nada', pronunciation: 'deh NAH-dah', difficulty: 2 }
      ];

      // Family & Relationships - Portuguese
      const familyPortuguese = [
        { nativeWord: 'Family', targetWord: 'Família', pronunciation: 'fah-MEE-lee-ah', difficulty: 1 },
        { nativeWord: 'Father', targetWord: 'Pai', pronunciation: 'PIE', difficulty: 1 },
        { nativeWord: 'Mother', targetWord: 'Mãe', pronunciation: 'MY', difficulty: 1 },
        { nativeWord: 'Son', targetWord: 'Filho', pronunciation: 'FEE-lyoo', difficulty: 1 },
        { nativeWord: 'Daughter', targetWord: 'Filha', pronunciation: 'FEE-lyah', difficulty: 1 },
        { nativeWord: 'Brother', targetWord: 'Irmão', pronunciation: 'eer-MY', difficulty: 1 },
        { nativeWord: 'Sister', targetWord: 'Irmã', pronunciation: 'eer-MY', difficulty: 1 },
        { nativeWord: 'Grandfather', targetWord: 'Avô', pronunciation: 'ah-VOH', difficulty: 1 },
        { nativeWord: 'Grandmother', targetWord: 'Avó', pronunciation: 'ah-VOH', difficulty: 1 },
        { nativeWord: 'Uncle', targetWord: 'Tio', pronunciation: 'TEE-oo', difficulty: 1 },
        { nativeWord: 'Aunt', targetWord: 'Tia', pronunciation: 'TEE-ah', difficulty: 1 },
        { nativeWord: 'Husband', targetWord: 'Marido', pronunciation: 'mah-REE-doo', difficulty: 2 },
        { nativeWord: 'Wife', targetWord: 'Esposa', pronunciation: 'es-POH-zah', difficulty: 2 },
        { nativeWord: 'Friend', targetWord: 'Amigo/Amiga', pronunciation: 'ah-MEE-goo/gah', difficulty: 1 },
        { nativeWord: 'Boyfriend', targetWord: 'Namorado', pronunciation: 'nah-moh-RAH-doo', difficulty: 2 }
      ];

      // Food & Dining - Portuguese
      const foodPortuguese = [
        { nativeWord: 'Food', targetWord: 'Comida', pronunciation: 'koh-MEE-dah', difficulty: 1 },
        { nativeWord: 'Water', targetWord: 'Água', pronunciation: 'AH-gwah', difficulty: 1 },
        { nativeWord: 'Rice', targetWord: 'Arroz', pronunciation: 'ah-ROHZ', difficulty: 1 },
        { nativeWord: 'Beans', targetWord: 'Feijão', pronunciation: 'fay-ZHOW', difficulty: 1 },
        { nativeWord: 'Meat', targetWord: 'Carne', pronunciation: 'KAR-neh', difficulty: 1 },
        { nativeWord: 'Chicken', targetWord: 'Frango', pronunciation: 'FRAN-goo', difficulty: 1 },
        { nativeWord: 'Fish', targetWord: 'Peixe', pronunciation: 'PAY-sheh', difficulty: 1 },
        { nativeWord: 'Bread', targetWord: 'Pão', pronunciation: 'POW', difficulty: 1 },
        { nativeWord: 'Fruit', targetWord: 'Fruta', pronunciation: 'FROO-tah', difficulty: 1 },
        { nativeWord: 'Orange', targetWord: 'Laranja', pronunciation: 'lah-RAN-zhah', difficulty: 1 },
        { nativeWord: 'Coffee', targetWord: 'Café', pronunciation: 'kah-FEH', difficulty: 1 },
        { nativeWord: 'Beer', targetWord: 'Cerveja', pronunciation: 'ser-VEH-zhah', difficulty: 1 },
        { nativeWord: 'Restaurant', targetWord: 'Restaurante', pronunciation: 'hes-tah-oo-RAN-teh', difficulty: 2 },
        { nativeWord: 'Menu', targetWord: 'Cardápio', pronunciation: 'kar-DAH-pee-oo', difficulty: 2 },
        { nativeWord: 'Delicious', targetWord: 'Delicioso', pronunciation: 'deh-lee-see-OH-zoo', difficulty: 2 },
        { nativeWord: 'Spicy', targetWord: 'Picante', pronunciation: 'pee-KAN-teh', difficulty: 2 },
        { nativeWord: 'Sweet', targetWord: 'Doce', pronunciation: 'DOH-seh', difficulty: 2 },
        { nativeWord: 'Bill/Check', targetWord: 'Conta', pronunciation: 'KON-tah', difficulty: 2 }
      ];

      // Shopping & Money - Portuguese
      const shoppingPortuguese = [
        { nativeWord: 'Money', targetWord: 'Dinheiro', pronunciation: 'deen-YAY-roo', difficulty: 1 },
        { nativeWord: 'Store', targetWord: 'Loja', pronunciation: 'LOH-zhah', difficulty: 1 },
        { nativeWord: 'Buy', targetWord: 'Comprar', pronunciation: 'kom-PRAR', difficulty: 1 },
        { nativeWord: 'Sell', targetWord: 'Vender', pronunciation: 'ven-DER', difficulty: 1 },
        { nativeWord: 'Price', targetWord: 'Preço', pronunciation: 'PREH-soo', difficulty: 2 },
        { nativeWord: 'Cheap', targetWord: 'Barato', pronunciation: 'bah-RAH-too', difficulty: 2 },
        { nativeWord: 'Expensive', targetWord: 'Caro', pronunciation: 'KAH-roo', difficulty: 2 },
        { nativeWord: 'How much?', targetWord: 'Quanto custa?', pronunciation: 'KWAN-too KOOS-tah', difficulty: 2 },
        { nativeWord: 'Credit card', targetWord: 'Cartão de crédito', pronunciation: 'kar-TOW deh KREH-dee-too', difficulty: 2 },
        { nativeWord: 'Cash', targetWord: 'Dinheiro', pronunciation: 'deen-YAY-roo', difficulty: 2 },
        { nativeWord: 'Shopping', targetWord: 'Compras', pronunciation: 'KOM-prahs', difficulty: 2 },
        { nativeWord: 'Market', targetWord: 'Mercado', pronunciation: 'mer-KAH-doo', difficulty: 2 },
        { nativeWord: 'Clothes', targetWord: 'Roupas', pronunciation: 'HOH-pahs', difficulty: 1 },
        { nativeWord: 'Shoes', targetWord: 'Sapatos', pronunciation: 'sah-PAH-toos', difficulty: 1 },
        { nativeWord: 'Size', targetWord: 'Tamanho', pronunciation: 'tah-MAN-yoo', difficulty: 2 }
      ];

      // Transportation - Portuguese
      const transportPortuguese = [
        { nativeWord: 'Car', targetWord: 'Carro', pronunciation: 'KAH-hoo', difficulty: 1 },
        { nativeWord: 'Bus', targetWord: 'Ônibus', pronunciation: 'OH-nee-boos', difficulty: 1 },
        { nativeWord: 'Taxi', targetWord: 'Táxi', pronunciation: 'TAH-ksee', difficulty: 1 },
        { nativeWord: 'Train', targetWord: 'Trem', pronunciation: 'trehn', difficulty: 1 },
        { nativeWord: 'Airplane', targetWord: 'Avião', pronunciation: 'ah-vee-OW', difficulty: 1 },
        { nativeWord: 'Bicycle', targetWord: 'Bicicleta', pronunciation: 'bee-see-KLEH-tah', difficulty: 1 },
        { nativeWord: 'Subway', targetWord: 'Metrô', pronunciation: 'meh-TROH', difficulty: 2 },
        { nativeWord: 'Airport', targetWord: 'Aeroporto', pronunciation: 'ah-eh-roo-POR-too', difficulty: 2 },
        { nativeWord: 'Station', targetWord: 'Estação', pronunciation: 'es-tah-SOW', difficulty: 2 },
        { nativeWord: 'Ticket', targetWord: 'Bilhete', pronunciation: 'bee-LYEH-teh', difficulty: 2 },
        { nativeWord: 'Driver', targetWord: 'Motorista', pronunciation: 'moh-toh-REES-tah', difficulty: 2 },
        { nativeWord: 'Traffic', targetWord: 'Trânsito', pronunciation: 'TRAN-see-too', difficulty: 2 },
        { nativeWord: 'Road', targetWord: 'Estrada', pronunciation: 'es-TRAH-dah', difficulty: 1 },
        { nativeWord: 'Map', targetWord: 'Mapa', pronunciation: 'MAH-pah', difficulty: 2 }
      ];

      // Work & School - Portuguese
      const workSchoolPortuguese = [
        { nativeWord: 'Work', targetWord: 'Trabalho', pronunciation: 'trah-BAH-lyoo', difficulty: 2 },
        { nativeWord: 'School', targetWord: 'Escola', pronunciation: 'es-KOH-lah', difficulty: 1 },
        { nativeWord: 'Student', targetWord: 'Estudante', pronunciation: 'es-too-DAN-teh', difficulty: 1 },
        { nativeWord: 'Teacher', targetWord: 'Professor', pronunciation: 'proh-feh-SOR', difficulty: 1 },
        { nativeWord: 'Book', targetWord: 'Livro', pronunciation: 'LEE-vroo', difficulty: 1 },
        { nativeWord: 'Study', targetWord: 'Estudar', pronunciation: 'es-too-DAR', difficulty: 2 },
        { nativeWord: 'Office', targetWord: 'Escritório', pronunciation: 'es-kree-TOH-ree-oo', difficulty: 2 },
        { nativeWord: 'Computer', targetWord: 'Computador', pronunciation: 'kom-poo-tah-DOR', difficulty: 2 },
        { nativeWord: 'Meeting', targetWord: 'Reunião', pronunciation: 'heh-oo-nee-OW', difficulty: 3 },
        { nativeWord: 'Boss', targetWord: 'Chefe', pronunciation: 'SHEH-feh', difficulty: 2 },
        { nativeWord: 'Colleague', targetWord: 'Colega', pronunciation: 'koh-LEH-gah', difficulty: 3 },
        { nativeWord: 'Job', targetWord: 'Emprego', pronunciation: 'em-PREH-goo', difficulty: 2 },
        { nativeWord: 'Salary', targetWord: 'Salário', pronunciation: 'sah-LAH-ree-oo', difficulty: 3 },
        { nativeWord: 'Experience', targetWord: 'Experiência', pronunciation: 'es-peh-ree-EN-see-ah', difficulty: 3 }
      ];

      // Health & Body - Portuguese
      const healthPortuguese = [
        { nativeWord: 'Body', targetWord: 'Corpo', pronunciation: 'KOR-poo', difficulty: 2 },
        { nativeWord: 'Head', targetWord: 'Cabeça', pronunciation: 'kah-BEH-sah', difficulty: 1 },
        { nativeWord: 'Eye', targetWord: 'Olho', pronunciation: 'OH-lyoo', difficulty: 1 },
        { nativeWord: 'Nose', targetWord: 'Nariz', pronunciation: 'nah-REES', difficulty: 1 },
        { nativeWord: 'Mouth', targetWord: 'Boca', pronunciation: 'BOH-kah', difficulty: 1 },
        { nativeWord: 'Hand', targetWord: 'Mão', pronunciation: 'MOW', difficulty: 1 },
        { nativeWord: 'Foot', targetWord: 'Pé', pronunciation: 'peh', difficulty: 1 },
        { nativeWord: 'Sick', targetWord: 'Doente', pronunciation: 'doh-EN-teh', difficulty: 2 },
        { nativeWord: 'Doctor', targetWord: 'Médico', pronunciation: 'MEH-dee-koo', difficulty: 2 },
        { nativeWord: 'Hospital', targetWord: 'Hospital', pronunciation: 'os-pee-TAL', difficulty: 2 },
        { nativeWord: 'Medicine', targetWord: 'Remédio', pronunciation: 'heh-MEH-dee-oo', difficulty: 2 },
        { nativeWord: 'Pain', targetWord: 'Dor', pronunciation: 'dor', difficulty: 2 },
        { nativeWord: 'Healthy', targetWord: 'Saudável', pronunciation: 'sah-oo-DAH-vel', difficulty: 2 }
      ];

      // Weather & Time - Portuguese
      const weatherTimePortuguese = [
        { nativeWord: 'Weather', targetWord: 'Tempo', pronunciation: 'TEM-poo', difficulty: 2 },
        { nativeWord: 'Hot', targetWord: 'Quente', pronunciation: 'KEN-teh', difficulty: 1 },
        { nativeWord: 'Cold', targetWord: 'Frio', pronunciation: 'FREE-oo', difficulty: 1 },
        { nativeWord: 'Rain', targetWord: 'Chuva', pronunciation: 'SHOO-vah', difficulty: 1 },
        { nativeWord: 'Sun', targetWord: 'Sol', pronunciation: 'sol', difficulty: 1 },
        { nativeWord: 'Snow', targetWord: 'Neve', pronunciation: 'NEH-veh', difficulty: 1 },
        { nativeWord: 'Wind', targetWord: 'Vento', pronunciation: 'VEN-too', difficulty: 1 },
        { nativeWord: 'Today', targetWord: 'Hoje', pronunciation: 'OH-zheh', difficulty: 1 },
        { nativeWord: 'Tomorrow', targetWord: 'Amanhã', pronunciation: 'ah-man-YAH', difficulty: 1 },
        { nativeWord: 'Yesterday', targetWord: 'Ontem', pronunciation: 'ON-tehn', difficulty: 1 },
        { nativeWord: 'Time', targetWord: 'Tempo', pronunciation: 'TEM-poo', difficulty: 2 },
        { nativeWord: 'Hour', targetWord: 'Hora', pronunciation: 'OH-rah', difficulty: 2 },
        { nativeWord: 'Minute', targetWord: 'Minuto', pronunciation: 'mee-NOO-too', difficulty: 2 },
        { nativeWord: 'Week', targetWord: 'Semana', pronunciation: 'seh-MAH-nah', difficulty: 2 },
        { nativeWord: 'Month', targetWord: 'Mês', pronunciation: 'mess', difficulty: 1 },
        { nativeWord: 'Year', targetWord: 'Ano', pronunciation: 'AH-noo', difficulty: 1 }
      ];

      // Add Portuguese vocabulary with category IDs
      const portugueseVocabularyData = [
        ...greetingsPortuguese.map(v => ({ ...v, categoryId: portugueseCategories[0].id })),
        ...familyPortuguese.map(v => ({ ...v, categoryId: portugueseCategories[1].id })),
        ...foodPortuguese.map(v => ({ ...v, categoryId: portugueseCategories[2].id })),
        ...shoppingPortuguese.map(v => ({ ...v, categoryId: portugueseCategories[3].id })),
        ...transportPortuguese.map(v => ({ ...v, categoryId: portugueseCategories[4].id })),
        ...workSchoolPortuguese.map(v => ({ ...v, categoryId: portugueseCategories[5].id })),
        ...healthPortuguese.map(v => ({ ...v, categoryId: portugueseCategories[6].id })),
        ...weatherTimePortuguese.map(v => ({ ...v, categoryId: portugueseCategories[7].id }))
      ];

      // Combine all vocabulary
      const allVocabulary = [...vocabularyData, ...portugueseVocabularyData].map(vocab => ({
        id: uuidv4(),
        ...vocab,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await queryInterface.bulkInsert('Vocabularies', allVocabulary, { transaction });

      // Create Trails for each category
      const trails = [];
      const allCategories = [...mandarinCategories, ...portugueseCategories];
      
      allCategories.forEach((category, index) => {
        trails.push({
          id: uuidv4(),
          name: `${category.name} Learning Trail`,
          categoryId: category.id,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      await queryInterface.bulkInsert('Trails', trails, { transaction });

      // Create Trail Steps for each trail
      const trailSteps = [];
      
      trails.forEach(trail => {
        // Step 1: Vocabulary Matching
        trailSteps.push({
          id: uuidv4(),
          trailId: trail.id,
          name: 'Vocabulary Matching',
          type: 'vocabulary_matching',
          stepNumber: 1,
          passingScore: 70,
          timeLimit: 300,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Step 2: Sentence Completion
        trailSteps.push({
          id: uuidv4(),
          trailId: trail.id,
          name: 'Sentence Completion',
          type: 'sentence_completion',
          stepNumber: 2,
          passingScore: 75,
          timeLimit: 240,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Step 3: Fill in the Blanks
        trailSteps.push({
          id: uuidv4(),
          trailId: trail.id,
          name: 'Fill in the Blanks',
          type: 'fill_blanks',
          stepNumber: 3,
          passingScore: 80,
          timeLimit: 180,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      await queryInterface.bulkInsert('TrailSteps', trailSteps, { transaction });

      // Create sample exercises for sentence completion and fill blanks
      const exercises = [];

      // Sample sentences for Mandarin categories
      const mandarinSentences = {
        [mandarinCategories[0].id]: [ // Greetings
          {
            targetSentence: '你好，我叫李明。',
            translation: 'Hello, my name is Li Ming.',
            missingWord: '你好',
            options: ['你好', '再见', '谢谢', '对不起'],
            correctOption: 0
          },
          {
            targetSentence: '很高兴认识___。',
            translation: 'Nice to meet you.',
            missingWord: '你',
            options: ['我', '你', '他', '她'],
            correctOption: 1
          }
        ],
        [mandarinCategories[1].id]: [ // Family
          {
            targetSentence: '这是我的___，他很聪明。',
            translation: 'This is my father, he is very smart.',
            missingWord: '爸爸',
            options: ['妈妈', '爸爸', '哥哥', '弟弟'],
            correctOption: 1
          }
        ],
        [mandarinCategories[2].id]: [ // Food
          {
            targetSentence: '我想要一碗___。',
            translation: 'I want a bowl of rice.',
            missingWord: '米饭',
            options: ['面条', '米饭', '肉', '鱼'],
            correctOption: 1
          }
        ]
      };

      // Sample sentences for Portuguese categories
      const portugueseSentences = {
        [portugueseCategories[0].id]: [ // Greetings
          {
            targetSentence: 'Olá, meu nome é João.',
            translation: 'Hello, my name is João.',
            missingWord: 'Olá',
            options: ['Olá', 'Tchau', 'Obrigado', 'Desculpa'],
            correctOption: 0
          },
          {
            targetSentence: 'Prazer em conhecê-___.',
            translation: 'Nice to meet you.',
            missingWord: 'lo',
            options: ['la', 'lo', 'los', 'las'],
            correctOption: 1
          }
        ],
        [portugueseCategories[1].id]: [ // Family
          {
            targetSentence: 'Este é meu ___, ele é médico.',
            translation: 'This is my father, he is a doctor.',
            missingWord: 'pai',
            options: ['mãe', 'pai', 'irmão', 'filho'],
            correctOption: 1
          }
        ],
        [portugueseCategories[2].id]: [ // Food
          {
            targetSentence: 'Eu quero um prato de ___.',
            translation: 'I want a plate of rice.',
            missingWord: 'arroz',
            options: ['feijão', 'arroz', 'carne', 'peixe'],
            correctOption: 1
          }
        ]
      };

      // Create exercises for sentence completion
      const sentenceCompletionSteps = trailSteps.filter(step => step.type === 'sentence_completion');
      
      Object.entries({...mandarinSentences, ...portugueseSentences}).forEach(([categoryId, sentences]) => {
        const relevantStep = sentenceCompletionSteps.find(step => {
          const trail = trails.find(t => t.id === step.trailId);
          return trail && trail.categoryId === categoryId;
        });

        if (relevantStep) {
          sentences.forEach((sentence, index) => {
            exercises.push({
              id: uuidv4(),
              trailStepId: relevantStep.id,
              type: 'sentence_completion',
              content: JSON.stringify(sentence),
              order: index + 1,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          });
        }
      });

      await queryInterface.bulkInsert('Exercises', exercises, { transaction });

      await transaction.commit();
      console.log('Database seeded successfully with Mandarin and Portuguese vocabulary!');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      await queryInterface.bulkDelete('Exercises', null, { transaction });
      await queryInterface.bulkDelete('TrailSteps', null, { transaction });
      await queryInterface.bulkDelete('Trails', null, { transaction });
      await queryInterface.bulkDelete('Vocabularies', null, { transaction });
      await queryInterface.bulkDelete('Categories', null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};