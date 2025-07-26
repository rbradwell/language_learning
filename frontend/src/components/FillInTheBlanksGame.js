// src/components/FillInTheBlanksGame.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AuthService from '../services/authService';
import FeedbackAnimation from './FeedbackAnimation';

// Simple pinyin to Chinese conversion map (basic implementation)
const pinyinMap = {
  'wo': '我',
  'ni': '你', 
  'ta': '他',
  'hen': '很',
  'hao': '好',
  'bu': '不',
  'shi': '是',
  'de': '的',
  'le': '了',
  'ma': '吗',
  'ne': '呢',
  'chi': '吃',
  'he': '和',
  'shui': '水',
  'fan': '饭',
  'cai': '菜',
  'rou': '肉',
  'yu': '鱼',
  'ji': '鸡',
  'zhu': '猪',
  'niu': '牛',
  'yang': '羊',
  'mian': '面',
  'tang': '汤',
  'cha': '茶',
  'kafei': '咖啡',
  'pijiu': '啤酒',
  'jiu': '酒',
  'nai': '奶',
  'tang2': '糖',
  'yan': '盐',
  'cu': '醋',
  'you': '油',
  'la': '辣',
  'tian': '甜',
  'suan': '酸',
  'ku': '苦',
  'xian': '咸',
  'qing': '清',
  'nong': '浓',
  'dan': '淡',
  'xin': '新',
  'jiu2': '旧',
  'da': '大',
  'xiao': '小',
  'gao': '高',
  'di': '低',
  'chang': '长',
  'duan': '短',
  'kuan': '宽',
  'zhai': '窄',
  'hou': '厚',
  'bao': '薄',
  'zhong': '重',
  'qing2': '轻',
  'kuai': '快',
  'man': '慢',
  'zao': '早',
  'wan': '晚',
  'shang': '上',
  'xia': '下',
  'zuo': '左',
  'you2': '右',
  'qian': '前',
  'hou2': '后',
  'li': '里',
  'wai': '外',
  'dong': '东',
  'xi': '西',
  'nan': '南',
  'bei': '北',
  'zhong2': '中',
  'jian': '间'
};

const WordButton = ({ word, onPress, style, textStyle, disabled }) => (
  <TouchableOpacity 
    onPress={() => !disabled && onPress(word)} 
    style={[style, disabled && styles.disabledButton]}
    disabled={disabled}
  >
    <Text style={[textStyle, disabled && styles.disabledButtonText]}>{word}</Text>
  </TouchableOpacity>
);

const PinyinIME = ({ onWordCreated, style, vocabularyData = [] }) => {
  const [compositionText, setCompositionText] = useState(''); // Current pinyin being typed
  const [candidates, setCandidates] = useState([]); // Conversion candidates
  const [selectedIndex, setSelectedIndex] = useState(0); // Currently highlighted candidate
  const [isComposing, setIsComposing] = useState(false); // Whether actively composing

  // Build dynamic pinyin dictionary from vocabulary data
  const buildPinyinDictionary = () => {
    const dictionary = {};
    
    vocabularyData.forEach(vocab => {
      if (vocab.pronunciation && vocab.targetWord) {
        // Clean up pronunciation - remove tone numbers and normalize
        let pinyin = vocab.pronunciation.toLowerCase()
          .replace(/[0-9]/g, '')
          .replace(/\s+/g, '')
          .trim();
        
        // Handle tone mark variations
        const toneMappings = {
          'wǒmen': 'women',
          'tāmen': 'tamen', 
          'nǐmen': 'nimen',
          'zàijiā': 'zaijia',
          'zǎocān': 'zaocan',
          'wǎncān': 'wancan',
          'zhōngcān': 'zhongcan',
          'zài': 'zai',
          'jiā': 'jia',
          'chī': 'chi',
          'hē': 'he',
          'shuǐ': 'shui',
          'fàn': 'fan'
        };
        
        // Use mapped version if available, otherwise remove tone marks
        pinyin = toneMappings[pinyin] || pinyin.replace(/[àáâãäåāă]/g, 'a')
          .replace(/[èéêëēĕ]/g, 'e')
          .replace(/[ìíîïīĭ]/g, 'i')
          .replace(/[òóôõöōŏ]/g, 'o')
          .replace(/[ùúûüūŭ]/g, 'u')
          .replace(/[ǖǘǚǜüū]/g, 'u');
        
        if (!dictionary[pinyin]) {
          dictionary[pinyin] = [];
        }
        
        // Calculate frequency based on difficulty (easier words = higher frequency)
        const difficultyFreq = vocab.difficulty === 'beginner' ? 1000 : 
                             vocab.difficulty === 'intermediate' ? 500 : 250;
        
        dictionary[pinyin].push({
          char: vocab.targetWord,
          freq: difficultyFreq,
          meaning: vocab.nativeWord || 'vocabulary',
          vocabId: vocab.id
        });
      }
    });
    
    // Sort each pinyin entry by frequency
    Object.keys(dictionary).forEach(key => {
      dictionary[key].sort((a, b) => b.freq - a.freq);
    });
    
    return dictionary;
  };

  const pinyinDictionary = buildPinyinDictionary();

  // Auto-segmentation: try to break input into valid syllables
  const segmentPinyin = (input) => {
    const segments = [];
    let remaining = input.toLowerCase();
    
    while (remaining.length > 0) {
      let found = false;
      
      // Try longest matches first (up to 8 characters)
      for (let len = Math.min(8, remaining.length); len >= 1; len--) {
        const segment = remaining.substring(0, len);
        if (pinyinDictionary[segment]) {
          segments.push(segment);
          remaining = remaining.substring(len);
          found = true;
          break;
        }
      }
      
      // If no match found, take one character and continue
      if (!found) {
        segments.push(remaining[0]);
        remaining = remaining.substring(1);
      }
    }
    
    return segments;
  };

  // Generate candidates for current composition
  const generateCandidates = (input) => {
    if (!input) return [];
    
    const candidates = [];
    
    // Try exact match from vocabulary dictionary
    if (pinyinDictionary[input]) {
      candidates.push(...pinyinDictionary[input].map(item => ({
        ...item,
        source: 'exact',
        segments: [input]
      })));
    }
    
    // Try segmented approach
    const segments = segmentPinyin(input);
    if (segments.length > 1) {
      // Try to combine all segments
      let combinedChars = '';
      let isValid = true;
      const meanings = [];
      
      for (const segment of segments) {
        if (pinyinDictionary[segment] && pinyinDictionary[segment].length > 0) {
          combinedChars += pinyinDictionary[segment][0].char;
          meanings.push(pinyinDictionary[segment][0].meaning);
        } else {
          isValid = false;
          break;
        }
      }
      
      if (isValid && combinedChars) {
        candidates.push({
          char: combinedChars,
          freq: 500,
          meaning: meanings.join(' + '),
          source: 'segmented',
          segments: segments
        });
      }
    }
    
    // Add partial matches (prefix matching) from vocabulary dictionary
    Object.keys(pinyinDictionary).forEach(key => {
      if (key.startsWith(input) && key !== input) {
        pinyinDictionary[key].forEach(item => {
          candidates.push({
            ...item,
            source: 'partial',
            segments: [key],
            isPartial: true
          });
        });
      }
    });
    
    // Sort by frequency and source priority
    return candidates
      .sort((a, b) => {
        // Prioritize exact matches, then segmented, then partial
        const sourceOrder = { 
          'exact': 3, 
          'segmented': 2, 
          'partial': 1 
        };
        if (sourceOrder[a.source] !== sourceOrder[b.source]) {
          return sourceOrder[b.source] - sourceOrder[a.source];
        }
        return b.freq - a.freq;
      })
      .slice(0, 8); // Limit to 8 candidates
  };

  const handleInputChange = (text) => {
    const cleanText = text.toLowerCase().replace(/[^a-z]/g, ''); // Only allow letters
    setCompositionText(cleanText);
    setIsComposing(cleanText.length > 0);
    
    if (cleanText.length > 0) {
      const newCandidates = generateCandidates(cleanText);
      setCandidates(newCandidates);
      setSelectedIndex(0);
    } else {
      setCandidates([]);
      setSelectedIndex(0);
    }
  };

  const commitCandidate = (index = selectedIndex) => {
    if (candidates[index]) {
      const candidate = candidates[index];
      onWordCreated(candidate.char);
      
      // Reset composition
      setCompositionText('');
      setCandidates([]);
      setSelectedIndex(0);
      setIsComposing(false);
    }
  };

  const handleKeyPress = (key) => {
    if (key >= '1' && key <= '8') {
      const index = parseInt(key) - 1;
      if (index < candidates.length) {
        commitCandidate(index);
      }
    }
  };

  return (
    <View style={style}>
      <View style={styles.imeContainer}>
        {/* Composition Input */}
        <View style={styles.compositionContainer}>
          <TextInput
            style={[styles.pinyinInput, isComposing && styles.pinyinInputComposing]}
            value={compositionText}
            onChangeText={handleInputChange}
            placeholder="Type pinyin (e.g., 'nihao' or 'wo shi')"
            placeholderTextColor="#999"
            autoCorrect={false}
            autoCapitalize="none"
            onSubmitEditing={() => commitCandidate(0)}
            returnKeyType="done"
          />
          
          {/* Composition Display */}
          {isComposing && (
            <View style={styles.compositionDisplay}>
              <Text style={styles.compositionText}>
                {compositionText}
                <Text style={styles.compositionCursor}>|</Text>
              </Text>
            </View>
          )}
        </View>
        
        {/* Candidate Window */}
        {candidates.length > 0 && (
          <View style={styles.candidateWindow}>
            <Text style={styles.candidateTitle}>选择字符 (Select Character):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.candidateScroll}>
              {candidates.map((candidate, index) => (
                <TouchableOpacity
                  key={`${candidate.char}-${index}`}
                  style={[
                    styles.candidateItem,
                    index === selectedIndex && styles.candidateItemSelected
                  ]}
                  onPress={() => commitCandidate(index)}
                >
                  <View style={styles.candidateContent}>
                    <Text style={styles.candidateNumber}>{index + 1}</Text>
                    <Text style={styles.candidateChar}>{candidate.char}</Text>
                    <Text style={styles.candidateMeaning} numberOfLines={1}>
                      {candidate.meaning}
                    </Text>
                    {candidate.isPartial && (
                      <Text style={styles.candidatePartial}>partial</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Text style={styles.candidateHint}>
              Tap to select or press number keys (1-{Math.min(candidates.length, 8)})
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};


const FillInTheBlanksGame = ({ route, navigation }) => {
  const { trailStep } = route?.params || {};
  
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [availableWords, setAvailableWords] = useState([]);
  const [userSentence, setUserSentence] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [createdWords, setCreatedWords] = useState([]);
  
  const feedbackTimeoutRef = useRef(null);

  useEffect(() => {
    startExercise();
    
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const startExercise = async () => {
    try {
      setLoading(true);
      
      console.log('Starting fill_blanks exercise...');
      
      // Get exercises from the trail step - try fill_blanks first, then sentence_completion
      const exercises = trailStep?.exercises || [];
      let fillBlanksExercise = exercises.find(ex => ex.type === 'fill_blanks' || ex.type === 'fill_in_blanks');
      
      // If no dedicated fill_blanks exercise found, use sentence_completion exercises
      // since fill_blanks uses the same sentences with pinyin input functionality
      if (!fillBlanksExercise) {
        fillBlanksExercise = exercises.find(ex => ex.type === 'sentence_completion');
        console.log('No fill_blanks exercise found, using sentence_completion exercise for fill_blanks mode');
      }
      
      if (!fillBlanksExercise) {
        Alert.alert('Error', 'No exercises found for this step');
        navigation.goBack();
        return;
      }

      console.log('=== FILL BLANKS EXERCISE START DEBUG ===');
      console.log('TrailStep ID:', trailStep?.id);
      console.log('TrailStep type:', trailStep?.type);
      console.log('Found fill_blanks exercise ID:', fillBlanksExercise.id);
      console.log('All exercises in step:', exercises.map(ex => ({ id: ex.id, type: ex.type })));
      
      const response = await AuthService.authenticatedFetch('/exercises/start-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exerciseId: fillBlanksExercise.id,
          isRetry: false
        })
      });

      const data = await response.json();
      console.log('=== BACKEND RESPONSE DEBUG ===');
      console.log('Response data keys:', Object.keys(data));
      console.log('data.success:', data.success);
      console.log('data.exercise:', data.exercise ? Object.keys(data.exercise) : 'undefined');
      console.log('data.session:', data.session ? Object.keys(data.session) : 'undefined');
      console.log('data.sentences:', data.sentences ? data.sentences.length : 'undefined');
      console.log('Full response:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        const vocabulary = data.exercise?.content?.vocabulary || [];
        
        if (vocabulary.length === 0) {
          Alert.alert('Error', 'No vocabulary data available for this exercise');
          navigation.goBack();
          return;
        }
        
        const formattedData = {
          ...data,
          sentences: data.exercise?.content?.sentences || [],
          vocabulary: data.exercise?.content?.vocabulary || []
        };
        
        console.log('=== FORMATTED DATA DEBUG ===');
        console.log('Real sentences:', formattedData.sentences?.length || 0);
        console.log('Real vocabulary:', formattedData.vocabulary?.length || 0);
        
        setSessionData(formattedData);
        setupCurrentSentence(formattedData, 0);
      } else {
        Alert.alert('Error', data.message || 'Failed to start exercise');
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const setupCurrentSentence = (data, sentenceIndex, currentCreatedWords = createdWords) => {
    if (!data.sentences || sentenceIndex >= data.sentences.length) {
      console.error('No sentences available or invalid sentence index');
      return;
    }

    const currentSentence = data.sentences[sentenceIndex];
    const sentenceVocabulary = currentSentence.vocabularyIds || [];
    
    // Get vocabulary data for this sentence
    const vocabularyForSentence = data.vocabulary.filter(vocab => 
      sentenceVocabulary.includes(vocab.id)
    );

    // Randomly hide 30-50% of the vocabulary words
    const hidePercentage = 0.3 + Math.random() * 0.2; // 30-50%
    const wordsToHide = Math.floor(vocabularyForSentence.length * hidePercentage);
    
    // Shuffle and select words to hide
    const shuffledVocab = [...vocabularyForSentence].sort(() => Math.random() - 0.5);
    const hiddenWords = shuffledVocab.slice(0, wordsToHide);
    const visibleWords = shuffledVocab.slice(wordsToHide);

    console.log(`=== DEBUG setupCurrentSentence ===`);
    console.log('Target sentence:', currentSentence.targetText);
    console.log('Total vocabulary:', vocabularyForSentence.length);
    console.log('Words to hide:', wordsToHide);
    console.log('Hidden words:', hiddenWords.map(w => w.targetWord));
    console.log('Visible words:', visibleWords.map(w => w.targetWord));
    
    // Show pinyin hints for hidden words
    console.log('\n🔧 PINYIN HINTS FOR MISSING WORDS:');
    hiddenWords.forEach(word => {
      let pinyin = word.pronunciation?.replace(/[0-9]/g, '').replace(/\s+/g, '').toLowerCase() || 'unknown';
      
      // Convert common toned pinyin to typed versions
      const pinyinMappings = {
        'wǒmen': 'women',
        'tāmen': 'tamen', 
        'nǐmen': 'nimen',
        'zàijiā': 'zaijia',
        'zǎocān': 'zaocan',
        'wǎncān': 'wancan',
        'zhōngcān': 'zhongcan'
      };
      
      pinyin = pinyinMappings[pinyin] || pinyin;
      console.log(`  Type "${pinyin}" to create: ${word.targetWord} (${word.nativeWord})`);
    });
    console.log('');

    // Set available words (visible + any previously created)
    setAvailableWords([...visibleWords, ...currentCreatedWords]);
    setUserSentence([]);
  };

  const handleWordCreated = (chineseWord) => {
    const newWord = {
      id: `created-${Date.now()}`,
      targetWord: chineseWord,
      nativeWord: 'User created',
      isUserCreated: true
    };
    
    setCreatedWords(prev => [...prev, newWord]);
    setAvailableWords(prev => [...prev, newWord]);
    
    console.log('Created word:', chineseWord);
  };

  const addWordToSentence = (word) => {
    setUserSentence(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter(w => w.id !== word.id));
  };

  const removeWordFromSentence = (wordToRemove, index) => {
    setUserSentence(prev => prev.filter((_, i) => i !== index));
    setAvailableWords(prev => [...prev, wordToRemove]);
  };

  const submitAnswer = async () => {
    if (userSentence.length === 0) {
      Alert.alert('Incomplete', 'Please build your sentence before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentSentence = sessionData.sentences[currentSentenceIndex];
      const userAnswer = userSentence.map(word => word.targetWord).join('');
      const correctAnswer = currentSentence.targetText;

      console.log('=== DEBUG submitAnswer ===');
      console.log('User answer:', userAnswer);
      console.log('Correct answer:', correctAnswer);

      console.log('Session data for submit:', {
        sessionId: sessionData.session?.id,
        exerciseId: sessionData.exercise?.id,
        sentenceId: currentSentence.id,
        sessionData: sessionData
      });

      const response = await AuthService.authenticatedFetch('/exercises/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionData.session?.id,
          sentenceId: currentSentence.id,
          userAnswer: userAnswer,
          correctAnswer: correctAnswer,
          questionIndex: currentSentenceIndex
        })
      });

      const result = await response.json();
      
      console.log('=== BACKEND RESPONSE ===');
      console.log('Result:', result);
      console.log('Success:', result.success);
      
      if (result.success) {
        const isCorrect = userAnswer === correctAnswer;
        console.log('=== FEEDBACK DEBUG ===');
        console.log('Answer is correct:', isCorrect);
        console.log('Setting feedback type:', isCorrect ? 'correct' : 'incorrect');
        
        setFeedbackType(isCorrect ? 'correct' : 'incorrect');
        setFeedbackVisible(true);
        
        console.log('Feedback animation should show now');

        feedbackTimeoutRef.current = setTimeout(() => {
          console.log('Hiding feedback animation');
          setFeedbackVisible(false);
          
          if (currentSentenceIndex + 1 < sessionData.sentences.length) {
            // Move to next sentence
            const nextIndex = currentSentenceIndex + 1;
            setCurrentSentenceIndex(nextIndex);
            setCreatedWords([]); // Reset created words BEFORE setting up next sentence
            setupCurrentSentence(sessionData, nextIndex, []); // Pass empty array for created words
          } else {
            // Exercise complete
            navigation.goBack();
          }
        }, 1400);
      } else {
        Alert.alert('Error', result.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', 'Unable to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSentence = sessionData?.sentences?.[currentSentenceIndex];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading exercise...</Text>
      </View>
    );
  }

  if (!sessionData || !currentSentence) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Unable to load exercise</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.progressText}>
            Sentence {currentSentenceIndex + 1} of {sessionData.sentences.length}
          </Text>
          <Text style={styles.instructionText}>
            Fill in the blanks by creating missing words with pinyin, then build the sentence
          </Text>
        </View>

        <View style={styles.sentenceContainer}>
          <Text style={styles.nativeText}>{currentSentence.nativeText}</Text>
          
          <View style={styles.userSentenceContainer}>
            {userSentence.length === 0 ? (
              <Text style={styles.placeholderText}>Tap words below to build your sentence</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.userSentence}>
                  {userSentence.map((word, index) => (
                    <TouchableOpacity
                      key={`${word.id}-${index}`}
                      style={styles.userWord}
                      onPress={() => removeWordFromSentence(word, index)}
                    >
                      <Text style={styles.userWordText}>{word.targetWord}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        <PinyinIME 
          onWordCreated={handleWordCreated}
          style={styles.pinyinSection}
          vocabularyData={sessionData?.vocabulary || []}
        />

        <View style={styles.wordsSection}>
          <Text style={styles.sectionTitle}>Available Words:</Text>
          <View style={styles.wordsContainer}>
            {availableWords.map((word) => (
              <WordButton
                key={word.id}
                word={word.targetWord}
                onPress={() => addWordToSentence(word)}
                style={[
                  styles.availableWord,
                  word.isUserCreated && styles.createdWord
                ]}
                textStyle={[
                  styles.availableWordText,
                  word.isUserCreated && styles.createdWordText
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={submitAnswer}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FeedbackAnimation 
        visible={feedbackVisible}
        type={feedbackType}
        onComplete={() => {
          setFeedbackVisible(false);
          setFeedbackType(null);
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 30,
  },
  progressText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  sentenceContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nativeText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  userSentenceContainer: {
    minHeight: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fafafa',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  userSentence: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  userWord: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  userWordText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  pinyinSection: {
    marginBottom: 20,
  },
  pinyinInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  suggestionsContainer: {
    maxHeight: 80,
  },
  suggestionButton: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  suggestionChinese: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  suggestionPinyin: {
    fontSize: 12,
    color: '#666',
  },
  wordsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  availableWord: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  availableWordText: {
    fontSize: 16,
    color: '#333',
  },
  createdWord: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4CAF50',
  },
  createdWordText: {
    color: '#2E7D32',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // IME Component Styles
  imeContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compositionContainer: {
    marginBottom: 10,
  },
  pinyinInputComposing: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  compositionDisplay: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 8,
    marginTop: 5,
  },
  compositionText: {
    fontSize: 16,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  compositionCursor: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  candidateWindow: {
    marginTop: 10,
  },
  candidateTitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  candidateScroll: {
    marginBottom: 8,
  },
  candidateItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  candidateItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  candidateContent: {
    alignItems: 'center',
  },
  candidateNumber: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  candidateChar: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  candidateMeaning: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    maxWidth: 70,
  },
  candidatePartial: {
    fontSize: 8,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 2,
  },
  candidateHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FillInTheBlanksGame;