// src/components/SentenceCompletionGame.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Animated,
  Vibration,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import AuthService from '../services/authService';
import FeedbackAnimation from './FeedbackAnimation';

const { width: screenWidth } = Dimensions.get('window');

// Simple word component - just handles taps, no dragging
const WordButton = ({ word, onPress, style, textStyle }) => (
  <TouchableOpacity onPress={() => onPress(word)} style={style}>
    <Text style={textStyle}>{word}</Text>
  </TouchableOpacity>
);

const SentenceCompletionGame = ({ route, navigation }) => {
  const { trailStep, trail, category } = route?.params || {};
  
  // Game state
  const [loading, setLoading] = useState(true);
  const [exerciseData, setExerciseData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [placedWords, setPlacedWords] = useState({});
  const [wordBank, setWordBank] = useState([]);
  const [hiddenWords, setHiddenWords] = useState([]);
  const [completedSentences, setCompletedSentences] = useState(new Set());
  const [showCorrectness, setShowCorrectness] = useState(false);
  const [incorrectSentences, setIncorrectSentences] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [draggedWord, setDraggedWord] = useState(null);
  const [draggedWordPosition, setDraggedWordPosition] = useState({ x: 0, y: 0 });
  const [initialDragPosition, setInitialDragPosition] = useState({ x: 0, y: 0 });
  const [userSentence, setUserSentence] = useState([]);
  const [wordBankBounds, setWordBankBounds] = useState(null);
  const [sentenceBounds, setSentenceBounds] = useState(null);
  const [dragOverZone, setDragOverZone] = useState(null); // 'sentence', 'wordBank', or null
  const [allCorrect, setAllCorrect] = useState(false);
  const [vocabularyModal, setVocabularyModal] = useState({ visible: false, word: null });
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [exerciseSession, setExerciseSession] = useState(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const isMountedRef = useRef(true);

  // Safe state setters to prevent updates after unmount
  const safeSetLoading = useCallback((value) => {
    if (isMountedRef.current) setLoading(value);
  }, []);

  const safeSetExerciseData = useCallback((value) => {
    if (isMountedRef.current) setExerciseData(value);
  }, []);

  const safeSetSessionData = useCallback((value) => {
    if (isMountedRef.current) setSessionData(value);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Start exercise session
  const startExercise = async () => {
    try {
      console.log('Starting sentence completion exercise...');
      
      // Get the first exercise from the trail step
      const exercises = trailStep?.exercises || [];
      const sentenceExercise = exercises.find(ex => ex.type === 'sentence_completion');
      
      if (!sentenceExercise) {
        Alert.alert('Error', 'No sentence completion exercise found for this step');
        navigation.goBack();
        return;
      }

      console.log('Exercise found:', sentenceExercise.id);
      
      const response = await AuthService.authenticatedFetch('/exercises/start-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId: sentenceExercise.id,
          isRetry: false
        })
      });

      const data = await response.json();
      console.log('Exercise session response:', data);

      if (data.success) {
        safeSetExerciseData(data.exercise);
        safeSetSessionData(data.session);
        setExerciseSession(data.session);
        
        // Initialize game state
        const sentences = data.exercise.content.sentences || [];
        if (sentences.length > 0) {
          setupCurrentSentence(sentences[0], data.exercise.content);
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to start exercise');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      Alert.alert('Error', 'Unable to connect to server');
      navigation.goBack();
    } finally {
      safeSetLoading(false);
    }
  };

  // Setup sentence with missing words
  const setupCurrentSentence = (sentence, exerciseContent) => {
    console.log('=== DEBUG setupCurrentSentence ===');
    const missingWordCount = exerciseContent.missingWordCount || 3;
    console.log('Missing word count:', missingWordCount);
    
    // Get vocabulary IDs for this sentence to identify individual words
    const vocabularyIds = sentence.vocabularyIds || [];
    const vocabulary = exerciseData?.content?.vocabulary || exerciseContent?.vocabulary || [];
    
    console.log('Vocabulary IDs for sentence:', vocabularyIds);
    console.log('Total vocabulary available:', vocabulary.length);
    
    // Create a mapping of vocabulary words in this sentence
    const sentenceVocabulary = vocabularyIds.map(id => {
      const found = vocabulary.find(v => v.id === id);
      if (!found) {
        console.log(`Vocabulary ID ${id} not found in vocabulary list`);
      }
      return found;
    }).filter(Boolean);
    
    console.log('Sentence vocabulary found:', sentenceVocabulary.map(v => ({
      id: v.id,
      targetWord: v.targetWord,
      nativeWord: v.nativeWord
    })));
    console.log('Target text:', sentence.targetText);
    
    // For Chinese sentences, use the vocabulary words that actually appear in the sentence
    const vocabularyWords = sentenceVocabulary.map(v => v.targetWord);
    console.log('All vocabulary words:', vocabularyWords);
    
    // Filter vocabulary words to only include those that appear in the target text
    const wordsInSentence = vocabularyWords.filter(word => {
      const found = sentence.targetText.includes(word);
      console.log(`Word "${word}" found in sentence: ${found}`);
      return found;
    });
    
    console.log('Words actually found in sentence:', wordsInSentence);
    
    // If no words found, fall back to simple approach
    if (wordsInSentence.length === 0) {
      console.log('No vocabulary words found in sentence, using fallback');
      // For fallback, don't create word-based exercises - just show error
      console.error('Cannot create sentence completion without vocabulary mapping');
      setWordBank([]);
      setHiddenWords([]);
      setPlacedWords({});
      setUserSentence([]);
      return;
    }
    
    // Check if sentence has words array, otherwise fall back to simple approach
    let wordsToHide = [];
    
    if (sentence.words && Array.isArray(sentence.words)) {
      // Use the sentence's words array directly (which already has the correct count)
      wordsToHide = [...sentence.words.filter(word => {
        // Only include words that are in our vocabulary list
        return wordsInSentence.includes(word);
      })];
    } else {
      // Fallback: just use the vocabulary words once each
      wordsToHide = [...wordsInSentence];
    }

    console.log('Final words to hide (with repeats):', wordsToHide);

    // Create word bank with hidden words (shuffled)
    const shuffledWordBank = [...wordsToHide];
    for (let i = shuffledWordBank.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledWordBank[i], shuffledWordBank[j]] = [shuffledWordBank[j], shuffledWordBank[i]];
    }

    setWordBank(shuffledWordBank);
    setHiddenWords(wordsToHide);
    setPlacedWords({});
    setDraggedWord(null);
    setUserSentence([]);
    setShowCorrectness(false);
  };

  // Get current sentence data
  const getCurrentSentence = () => {
    if (!exerciseData?.content?.sentences || currentSentenceIndex >= exerciseData.content.sentences.length) {
      return null;
    }
    return exerciseData.content.sentences[currentSentenceIndex];
  };

  // Handle inserting word at specific position
  const insertWordAtPosition = (word, insertIndex) => {
    setUserSentence(prev => {
      const newSentence = [...prev];
      newSentence.splice(insertIndex, 0, word);
      return newSentence;
    });
    setWordBank(prev => prev.filter(w => w !== word));
  };

  // Handle removing word from user sentence
  const removeWordFromSentence = (wordIndex) => {
    const word = userSentence[wordIndex];
    setUserSentence(prev => prev.filter((_, index) => index !== wordIndex));
    setWordBank(prev => [...prev, word]);
  };

  // Handle reordering words within the user sentence
  const reorderWordsInSentence = (draggedWord, draggedFromIndex, targetIndex) => {
    setUserSentence(prev => {
      const newSentence = [...prev];
      // Remove from original position
      newSentence.splice(draggedFromIndex, 1);
      // Insert at new position
      newSentence.splice(targetIndex, 0, draggedWord);
      return newSentence;
    });
  };

  // Handle drag start for words already in sentence
  const handleSentenceWordDragStart = (word, wordIndex, event) => {
    console.log('=== DRAG START (Sentence) ===');
    console.log('Word:', word, 'Index:', wordIndex);
    
    const { absoluteX, absoluteY } = event.nativeEvent;
    setInitialDragPosition({ x: absoluteX, y: absoluteY });
    setDraggedWord({ word, fromSentence: true, originalIndex: wordIndex });
    
    // Start from the original position (no translation yet)
    dragX.setValue(0);
    dragY.setValue(0);
    
    Animated.spring(dragScale, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  // Calculate drop position within sentence based on drop coordinates
  const calculateDropPosition = (absoluteX) => {
    const wordsCount = userSentence.length;
    
    if (wordsCount === 0) return 0;
    
    if (!sentenceBounds) {
      // Fallback to simple approach
      const screenWidth = Dimensions.get('window').width;
      return absoluteX < screenWidth / 2 ? 0 : wordsCount;
    }
    
    // More precise positioning based on sentence bounds
    const relativeX = absoluteX - sentenceBounds.x;
    const wordWidth = sentenceBounds.width / (wordsCount + 1); // +1 for potential new position
    const targetIndex = Math.round(relativeX / wordWidth);
    
    return Math.max(0, Math.min(wordsCount, targetIndex));
  };

  // Simplified zone detection using screen regions
  const isInWordBankArea = (absoluteY) => {
    const screenHeight = Dimensions.get('window').height;
    // Word bank is in bottom 35% of screen - made more generous
    return absoluteY > screenHeight * 0.65;
  };

  // Check if coordinates are within sentence construction area  
  const isInSentenceArea = (absoluteY) => {
    const screenHeight = Dimensions.get('window').height;
    // Sentence area is in middle portion of screen
    return absoluteY > screenHeight * 0.25 && absoluteY < screenHeight * 0.65;
  };

  // Handle drag start for word bank items
  const handleWordDragStart = (word, event) => {
    console.log('=== DRAG START (Word Bank) ===');
    console.log('Word:', word);
    
    const { absoluteX, absoluteY } = event.nativeEvent;
    setInitialDragPosition({ x: absoluteX, y: absoluteY });
    setDraggedWord({ word, fromSentence: false });
    
    // Start from the original position (no translation yet)
    dragX.setValue(0);
    dragY.setValue(0);
    
    Animated.spring(dragScale, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  // Handle drag gesture
  const handleWordDrag = (event) => {
    if (!draggedWord) return;
    
    const { translationX, translationY, absoluteY } = event.nativeEvent;
    
    // Use translation values for smooth dragging from the original position
    dragX.setValue(translationX);
    dragY.setValue(translationY);
    
    // Update drag over zone for visual feedback using absolute coordinates
    if (isInSentenceArea(absoluteY)) {
      setDragOverZone('sentence');
    } else if (isInWordBankArea(absoluteY)) {
      setDragOverZone('wordBank');
    } else {
      setDragOverZone(null);
    }
  };

  // Handle drag end - simplified logic
  const handleWordDragEnd = (event) => {
    if (!draggedWord) return;

    console.log('=== DRAG END DEBUG ===');
    console.log('Dragged word:', draggedWord);

    // Reset drag animation
    Animated.spring(dragScale, { toValue: 1, useNativeDriver: true }).start();

    const { absoluteY, absoluteX } = event.nativeEvent;
    const screenHeight = Dimensions.get('window').height;
    console.log('Drop coordinates:', { absoluteX, absoluteY });
    console.log('Screen height:', screenHeight);
    console.log('Word bank threshold:', screenHeight * 0.65);
    console.log('Sentence area range:', screenHeight * 0.25, 'to', screenHeight * 0.65);
    
    // Simplified drop logic
    if (isInWordBankArea(absoluteY)) {
      console.log('Dropped in word bank area');
      if (draggedWord.fromSentence) {
        // Remove from sentence and return to word bank
        console.log('Removing from sentence');
        removeWordFromSentence(draggedWord.originalIndex);
      }
      
    } else if (isInSentenceArea(absoluteY)) {
      console.log('Dropped in sentence area');
      if (draggedWord.fromSentence) {
        // Reordering within sentence - implement proper reordering
        console.log('Reordering within sentence');
        const screenWidth = Dimensions.get('window').width;
        const targetIndex = absoluteX < screenWidth / 2 ? 0 : userSentence.length - 1;
        console.log('Target index:', targetIndex, 'Original index:', draggedWord.originalIndex);
        if (targetIndex !== draggedWord.originalIndex) {
          reorderWordsInSentence(draggedWord.word, draggedWord.originalIndex, targetIndex);
        }
      } else {
        // Adding from word bank to sentence - add to end for simplicity
        console.log('Adding to sentence');
        insertWordAtPosition(draggedWord.word, userSentence.length);
      }
      
    } else {
      console.log('Dropped outside areas - Y coordinate:', absoluteY);
      if (draggedWord.fromSentence) {
        // Remove from sentence and return to word bank
        console.log('Removing from sentence (outside drop)');
        removeWordFromSentence(draggedWord.originalIndex);
      }
    }

    setDraggedWord(null);
    setDragOverZone(null);
    setInitialDragPosition({ x: 0, y: 0 });
  };

  // Remove word from placeholder
  const handlePlaceholderRemove = (placeholderId) => {
    const placedWord = placedWords[placeholderId];
    if (placedWord) {
      setPlacedWords(prev => {
        const newPlaced = { ...prev };
        delete newPlaced[placeholderId];
        return newPlaced;
      });
      
      setWordBank(prev => [...prev, placedWord]);
    }
  };

  // Check if sentence is complete
  const isSentenceComplete = () => {
    // Sentence is complete when all words are placed and equals the number of hidden words
    return userSentence.length === hiddenWords.length;
  };

  // Submit current sentence
  const submitSentence = async () => {
    if (!isSentenceComplete()) {
      Alert.alert('Incomplete', 'Please fill in all missing words before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get the correct order of words as they appear in the target text
      const sentence = getCurrentSentence();
      const vocabularyIds = sentence.vocabularyIds || [];
      const vocabulary = exerciseData?.content?.vocabulary || [];
      
      // Create the correct order by finding vocabulary words in the target text order
      const correctOrder = [];
      const targetText = sentence.targetText;
      
      // Get vocabulary items for this sentence
      const sentenceVocabulary = vocabularyIds.map(id => {
        return vocabulary.find(v => v.id === id);
      }).filter(Boolean);
      
      // Build correct order by finding all occurrences of vocabulary words in order
      const sortedVocab = [];
      let searchPosition = 0;
      
      // Keep finding the next vocabulary word in the target text
      while (searchPosition < targetText.length) {
        let nextWord = null;
        let nextPosition = targetText.length;
        
        // Find which vocabulary word appears next
        for (const vocabItem of sentenceVocabulary) {
          const word = vocabItem.targetWord;
          const wordPosition = targetText.indexOf(word, searchPosition);
          if (wordPosition !== -1 && wordPosition < nextPosition) {
            nextPosition = wordPosition;
            nextWord = word;
          }
        }
        
        if (nextWord && hiddenWords.includes(nextWord)) {
          sortedVocab.push(nextWord);
          searchPosition = nextPosition + nextWord.length;
        } else {
          break;
        }
      }
      
      console.log('=== SUBMIT DEBUG ===');
      console.log('Target text:', targetText);
      console.log('Hidden words:', hiddenWords);
      console.log('Correct order (by position):', sortedVocab);
      console.log('User order:', userSentence);
      console.log('Correct order JSON:', JSON.stringify(sortedVocab));
      console.log('User order JSON:', JSON.stringify(userSentence));
      console.log('Arrays equal?:', JSON.stringify(sortedVocab) === JSON.stringify(userSentence));
      console.log('Length comparison - Correct:', sortedVocab.length, 'User:', userSentence.length);
      
      // Check each word individually
      for (let i = 0; i < Math.max(sortedVocab.length, userSentence.length); i++) {
        const correctWord = sortedVocab[i] || 'MISSING';
        const userWord = userSentence[i] || 'MISSING';
        const matches = correctWord === userWord;
        console.log(`Position ${i}: Correct="${correctWord}" User="${userWord}" Match=${matches}`);
      }
      
      // Submit answer to backend - let server determine correctness
      console.log('=== SESSION DEBUG ===');
      console.log('Exercise session object:', exerciseSession);
      console.log('Session ID being submitted:', exerciseSession?.id);
      console.log('Sentence ID:', sentence.id);
      console.log('Current sentence index:', currentSentenceIndex);
      
      const submitResponse = await AuthService.authenticatedFetch('/exercises/submit-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: exerciseSession.id,
          sentenceId: sentence.id || currentSentenceIndex, // Use sentence ID if available, fallback to index
          userAnswer: userSentence.join(' ')
        })
      });

      const submitData = await submitResponse.json();
      console.log('Submit answer response:', submitData);

      if (submitData.success) {
        // Update score from server
        setScore(submitData.currentScore || score);

        if (submitData.isCorrect) {
          setCompletedSentences(prev => new Set([...prev, currentSentenceIndex]));
          
          // Show correct feedback animation
          setFeedbackType('correct');
          setFeedbackVisible(true);
          
          // Check if exercise is complete
          if (submitData.sessionComplete) {
            setTimeout(() => {
              finishExercise();
            }, 1400);
          } else {
            // Move to next sentence after animation
            setTimeout(() => {
              moveToNextSentence();
            }, 1400);
          }
        } else {
          // Add to incorrect sentences for replay
          if (!incorrectSentences.includes(currentSentenceIndex)) {
            setIncorrectSentences(prev => [...prev, currentSentenceIndex]);
          }
          
          // Show incorrect feedback animation
          setFeedbackType('incorrect');
          setFeedbackVisible(true);
          
          // Reset user sentence and return words to bank, then move to next sentence
          setTimeout(() => {
            setWordBank(prev => [...prev, ...userSentence]);
            setUserSentence([]);
            moveToNextSentence(); // Move to next sentence even if wrong
          }, 1400);
        }
      } else {
        console.error('Failed to submit answer:', submitData);
        Alert.alert('Error', 'Failed to submit answer. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting sentence:', error);
      Alert.alert('Error', 'Failed to submit answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move to next sentence
  const moveToNextSentence = () => {
    // Reset feedback state
    setFeedbackVisible(false);
    setFeedbackType(null);
    
    const sentences = exerciseData?.content?.sentences || [];
    
    if (currentSentenceIndex < sentences.length - 1) {
      // Move to next sentence
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      setupCurrentSentence(sentences[nextIndex], exerciseData.content);
      
      // Animate transition
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
      
    } else if (incorrectSentences.length > 0) {
      // Replay incorrect sentences silently
      const nextIncorrectIndex = incorrectSentences[0];
      setIncorrectSentences(prev => prev.slice(1));
      setCurrentSentenceIndex(nextIncorrectIndex);
      setupCurrentSentence(sentences[nextIncorrectIndex], exerciseData.content);
      
      // Animate transition to retry sentence
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
      
    } else {
      // All sentences completed correctly
      finishExercise();
    }
  };

  // Finish exercise
  const finishExercise = async () => {
    // Session completion is automatically handled by the backend when
    // the score reaches totalQuestions in the submitAnswer endpoint
    
    const totalSentences = exerciseData?.content?.sentences?.length || 0;
    setAllCorrect(score === totalSentences);
    setShowResults(true);
    
    // Success vibration pattern
    Vibration.vibrate([100, 50, 100, 50, 100]);
  };

  // Show vocabulary popup
  const showVocabularyInfo = (word) => {
    const vocabulary = exerciseData?.content?.vocabulary || [];
    const vocabItem = vocabulary.find(v => v.targetWord === word.trim());
    
    if (vocabItem) {
      setVocabularyModal({
        visible: true,
        word: vocabItem
      });
    }
  };

  // Initialize exercise on mount
  useEffect(() => {
    startExercise();
  }, []);


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sentence completion exercise...</Text>
      </View>
    );
  }

  // Render completion screen
  const renderCompletion = () => {
    return (
      <View style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.congratsTitle}>
            Exercise Complete!
          </Text>
          
          {/* Progress Information */}
          <Text style={styles.progressInfo}>
            All sentences completed in "{trailStep?.name}"!
          </Text>
          
          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const currentSentence = getCurrentSentence();

  // Show completion screen instead of game
  if (showResults) {
    return renderCompletion();
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={false}
        renderToHardwareTextureAndroid={true}
      >
        {/* Progress indicator */}
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {score} / {exerciseData?.content?.sentences?.length || 0} correct
          </Text>
        </View>

        {/* Native sentence */}
        <View style={styles.nativeSection}>
          <Text style={styles.nativeLabel}>English:</Text>
          <Text style={styles.nativeText}>{currentSentence?.nativeText}</Text>
        </View>


        {/* User's sentence construction area */}
        <Animated.View style={[styles.sentenceSection, { opacity: fadeAnim }]}>
          <Text style={styles.sentenceLabel}>Your sentence (tap words to build):</Text>
          <View 
            style={[
              styles.userSentenceContainer,
              dragOverZone === 'sentence' && styles.userSentenceContainerActive
            ]}
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout;
              setSentenceBounds({ x, y, width, height });
            }}
          >
            {userSentence.length === 0 ? (
              <Text style={styles.dropZoneText}>Tap words below to build your sentence</Text>
            ) : (
              <View style={styles.userWordsContainer}>
                {userSentence.map((word, index) => (
                  <WordButton
                    key={`user-word-${index}`}
                    word={word}
                    onPress={() => {
                      // Remove word from sentence and return to word bank
                      const newSentence = [...userSentence];
                      newSentence.splice(index, 1);
                      setUserSentence(newSentence);
                      setWordBank(prev => [...prev, word]);
                    }}
                    style={styles.userWord}
                    textStyle={styles.userWordText}
                  />
                ))}
              </View>
            )}
          </View>
        </Animated.View>

        {/* Word bank */}
        <View style={styles.wordBankSection}>
          <Text style={styles.wordBankLabel}>Tap words to complete the sentence:</Text>
          <View 
            style={styles.wordBank}
            onLayout={(event) => {
              const { x, y, width, height } = event.nativeEvent.layout;
              setWordBankBounds({ x, y, width, height });
            }}
          >
            {wordBank?.map((word, index) => (
              <WordButton
                key={`bank-${index}`}
                word={word}
                onPress={() => {
                  // Add word to end of sentence and remove this specific instance from word bank
                  setUserSentence(prev => [...prev, word]);
                  setWordBank(prev => {
                    const newBank = [...prev];
                    newBank.splice(index, 1); // Remove only this specific instance
                    return newBank;
                  });
                }}
                style={styles.wordBankItem}
                textStyle={styles.wordBankText}
              />
            ))}
          </View>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSentenceComplete() ? styles.submitButtonActive : styles.submitButtonDisabled
          ]}
          onPress={submitSentence}
          disabled={!isSentenceComplete() || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            isSentenceComplete() ? styles.submitButtonTextActive : styles.submitButtonTextDisabled
          ]}>
            {isSubmitting ? 'Submitting...' : 'Submit Answer'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Feedback Animation */}
      <FeedbackAnimation
        visible={feedbackVisible}
        type={feedbackType}
        onComplete={() => {
          setFeedbackVisible(false);
          setFeedbackType(null);
        }}
      />

      {/* Vocabulary Modal */}
      <Modal
        visible={vocabularyModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVocabularyModal({ visible: false, word: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Word Information</Text>
            <Text style={styles.modalTargetWord}>{vocabularyModal.word?.targetWord}</Text>
            <Text style={styles.modalNativeWord}>{vocabularyModal.word?.nativeWord}</Text>
            <Text style={styles.modalPronunciation}>{vocabularyModal.word?.pronunciation}</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setVocabularyModal({ visible: false, word: null })}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  completionContainer: {
    flex: 1,
    backgroundColor: '#007AFF',
  },
  completionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#007AFF',
  },
  congratsTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  progressInfo: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    maxWidth: 150,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: 'white',
  },
  primaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  nativeSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nativeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  nativeText: {
    fontSize: 24,
    color: '#333',
    lineHeight: 32,
    textAlign: 'center',
  },
  sentenceSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0, // Remove elevation to prevent z-index conflicts
    zIndex: 1, // Lower than dragged items
  },
  sentenceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontWeight: '600',
  },
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sentenceText: {
    fontSize: 24,
    color: '#333',
    lineHeight: 36,
    fontWeight: '500',
    textAlign: 'center',
  },
  userSentenceContainer: {
    minHeight: 80,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userSentenceContainerActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0fff0',
  },
  dropZoneText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  userWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 50,
    width: '100%',
  },
  userWord: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    margin: 4,
  },
  userWordText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  wordContainer: {
    marginHorizontal: 2,
    marginVertical: 2,
  },
  targetWord: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '500',
    textDecorationLine: 'underline',
    textDecorationColor: '#007AFF',
    textDecorationStyle: 'dotted',
  },
  punctuation: {
    fontSize: 20,
    color: '#333',
    marginHorizontal: 1,
  },
  placeholder: {
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  placeholderFilled: {
    backgroundColor: '#f0f4f8',
    borderColor: '#2196F3',
    borderStyle: 'solid',
  },
  placeholderText: {
    fontSize: 18,
    color: '#999',
    fontWeight: '500',
  },
  placeholderFilledText: {
    color: '#1976D2',
  },
  wordBankSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: -1, // Negative elevation to go behind dragged items
    zIndex: -1, // Negative z-index to go behind dragged items
  },
  wordBankLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontWeight: '600',
  },
  wordBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 80, // Fixed minimum height regardless of content
  },
  wordBankItem: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  wordBankText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  wordBankTextSelected: {
    color: 'white',
  },
  wordBankTextDragging: {
    color: 'white',
    fontWeight: 'bold',
  },
  placedWordContainer: {
    padding: 2,
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  floatingDraggedWord: {
    position: 'absolute',
    backgroundColor: '#007AFF', // Use same color as word bank items
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 1001,
    zIndex: 1001,
  },
  floatingDraggedWordText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  submitButtonActive: {
    backgroundColor: '#007AFF',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButtonTextActive: {
    color: 'white',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  modalTargetWord: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  modalNativeWord: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  modalPronunciation: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCloseText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 300,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultsScore: {
    fontSize: 22,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 10,
  },
  resultsDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  resultsButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SentenceCompletionGame;