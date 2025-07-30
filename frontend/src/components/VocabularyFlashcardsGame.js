// src/components/VocabularyFlashcardsGame.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Switch,
} from 'react-native';
import AuthService from '../services/authService';

const { width: screenWidth } = Dimensions.get('window');

const VocabularyFlashcardsGame = ({ route, navigation }) => {
  const { trailStep, category } = route?.params || {};
  
  // Game states
  const [gameState, setGameState] = useState('loading'); // loading, countdown, playing, completed
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exerciseSession, setExerciseSession] = useState(null);
  const [vocabularyData, setVocabularyData] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [dismissedCards, setDismissedCards] = useState(new Set());
  
  // Card states
  const [cardFlipped, setCardFlipped] = useState({});
  const [cardRandomSide, setCardRandomSide] = useState({});
  
  // Auto-advance functionality
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(false);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState(10);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  // Animation refs
  const countdownInterval = useRef(null);
  const autoAdvanceInterval = useRef(null);
  const isMountedRef = useRef(true);
  const flipAnimations = useRef(new Map()).current;
  const cardTransitionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initializeGame = async () => {
      console.log('=== VocabularyFlashcardsGame MOUNTED ===');
      console.log('trailStep:', trailStep);
      console.log('category:', category);
      
      if (!trailStep || !category) {
        console.error('Missing required parameters:', { trailStep, category });
        setHasError(true);
        return;
      }

      await findAndStartExercise();
    };

    initializeGame();
    
    return () => {
      isMountedRef.current = false;
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (autoAdvanceInterval.current) clearInterval(autoAdvanceInterval.current);
    };
  }, []);

  // Auto-advance timer effect
  useEffect(() => {
    if (gameState === 'playing' && vocabularyData.length > 0) {
      resetAutoAdvanceTimer();
    }
    return () => {
      if (autoAdvanceInterval.current) {
        clearInterval(autoAdvanceInterval.current);
      }
    };
  }, [autoAdvanceEnabled, gameState, currentCardIndex]);

  const findAndStartExercise = async () => {
    try {
      console.log('Finding vocabulary flashcards exercise...');
      
      const response = await AuthService.authenticatedFetch('/exercises/trail-steps-progress');
      const data = await response.json();
      
      console.log('API response:', data);
      
      if (data.success) {
        const categoryData = data.data.find(cat => cat.id === category.id);
        const stepData = categoryData?.trailSteps.find(ts => ts.id === trailStep.id);
        
        console.log('stepData:', stepData);
        console.log('stepData.exercises:', stepData?.exercises);
        
        if (stepData?.exercises && stepData.exercises.length > 0) {
          const exercise = stepData.exercises.find(ex => ex.exerciseStatus === 'not_attempted') ||
                          stepData.exercises.find(ex => ex.exerciseStatus === 'in_progress') ||
                          stepData.exercises.find(ex => ex.exerciseStatus === 'completed' && !ex.passed);
          
          console.log('Selected exercise:', exercise);
          
          if (exercise) {
            console.log('Starting exercise:', exercise);
            setCurrentExercise(exercise);
            startCountdown(exercise);
          } else {
            console.log('All exercises completed or no suitable exercise found');
            console.log('Available exercises:', stepData.exercises);
            Alert.alert('Exercise Complete', 'All vocabulary flashcard exercises have been completed!', [
              { text: 'OK', onPress: () => navigation.navigate('TrailSteps', { category }) }
            ]);
          }
        } else {
          Alert.alert('No Exercises', 'This step doesn\'t have any exercises available.');
          navigation.navigate('TrailSteps', { category });
        }
      }
    } catch (error) {
      console.error('Error finding exercise:', error);
      Alert.alert('Error', 'Unable to load exercises');
    }
  };

  const startCountdown = (exercise) => {
    setGameState('countdown');
    setCountdown(3);
    
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          startExercise(exercise);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startExercise = async (exercise) => {
    try {
      console.log('Starting exercise with data:', exercise);
      setGameState('playing');
      
      const exerciseToUse = exercise || currentExercise;
      console.log('Exercise to use:', exerciseToUse);
      
      const requestBody = {
        exerciseId: exerciseToUse.id,
        isRetry: exerciseToUse.exerciseStatus === 'completed'
      };
      
      console.log('Sending request body:', requestBody);
      
      const response = await AuthService.authenticatedFetch('/exercises/start-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      console.log('Start exercise response:', data);
      
      if (data.success) {
        setExerciseSession(data.session);
        const vocabulary = data.exercise.content.vocabulary;
        console.log('Vocabulary data:', vocabulary);
        console.log('Session data:', data.session);
        
        setVocabularyData(vocabulary);
        
        // Initialize card states and animations
        const initialFlipped = {};
        const initialRandomSide = {};
        
        vocabulary.forEach((vocab, index) => {
          // Randomly determine which side is initially face up
          const showNative = Math.random() < 0.5;
          initialFlipped[vocab.id] = false;
          initialRandomSide[vocab.id] = showNative;
          
          // Initialize fade animation (start fully visible)
          if (!flipAnimations.has(vocab.id)) {
            flipAnimations.set(vocab.id, new Animated.Value(1));
          }
        });
        
        setCardFlipped(initialFlipped);
        setCardRandomSide(initialRandomSide);
        
      } else {
        throw new Error(data.message || 'Failed to start exercise');
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      Alert.alert('Error', 'Failed to start exercise');
    }
  };

  const handleCardPress = (vocabId) => {
    const fadeAnim = flipAnimations.get(vocabId);
    const isCurrentlyFlipped = cardFlipped[vocabId];
    
    // Simple fade out, change content, fade in
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Update flipped state after fade out starts
    setTimeout(() => {
      setCardFlipped(prev => ({
        ...prev,
        [vocabId]: !isCurrentlyFlipped
      }));
    }, 150);
  };

  const animateCardTransition = (callback) => {
    // Slide out current card
    Animated.timing(cardTransitionAnim, {
      toValue: -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Execute the callback (change card)
      callback();
      
      // Reset position for slide in
      cardTransitionAnim.setValue(screenWidth);
      
      // Slide in new card
      Animated.timing(cardTransitionAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const moveToNextCard = () => {
    const nextIndex = getNextCardIndex();
    if (nextIndex === -1) {
      // No more cards remaining, complete exercise
      completeExercise();
    } else {
      animateCardTransition(() => {
        setCurrentCardIndex(nextIndex);
        resetAutoAdvanceTimer();
      });
    }
  };

  const skipCard = () => {
    const currentVocab = vocabularyData[currentCardIndex];
    const newDismissedCards = new Set(dismissedCards);
    newDismissedCards.add(currentVocab.id);
    
    // Move to next card or complete if no more cards
    const nextIndex = getNextCardIndex();
    if (nextIndex === -1 || getRemainingCards().length === 1) {
      completeExercise();
    } else {
      animateCardTransition(() => {
        setDismissedCards(newDismissedCards);
        
        // Find next card among remaining ones
        const remaining = vocabularyData.filter(vocab => !newDismissedCards.has(vocab.id));
        if (remaining.length > 0) {
          const nextVocab = remaining[0];
          const nextIdx = vocabularyData.findIndex(vocab => vocab.id === nextVocab.id);
          setCurrentCardIndex(nextIdx);
          resetAutoAdvanceTimer();
        } else {
          completeExercise();
        }
      });
    }
  };

  const startAutoAdvanceTimer = () => {
    if (!autoAdvanceEnabled) return;
    
    setIsCountingDown(true);
    setAutoAdvanceCountdown(10);
    
    autoAdvanceInterval.current = setInterval(() => {
      setAutoAdvanceCountdown(prev => {
        if (prev <= 1) {
          clearInterval(autoAdvanceInterval.current);
          setIsCountingDown(false);
          moveToNextCard();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetAutoAdvanceTimer = () => {
    if (autoAdvanceInterval.current) {
      clearInterval(autoAdvanceInterval.current);
    }
    setIsCountingDown(false);
    setAutoAdvanceCountdown(10);
    if (autoAdvanceEnabled) {
      startAutoAdvanceTimer();
    }
  };


  const completeExercise = async () => {
    setGameState('completed');
    
    // Submit answers for all vocabulary words using the existing submitAnswer endpoint
    try {
      // Submit each vocabulary word as a correct answer
      for (const vocab of vocabularyData) {
        await AuthService.authenticatedFetch('/exercises/submit-answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: exerciseSession.id,
            vocabularyId: vocab.id,
            userAnswer: vocab.targetWord, // Use target word as the "answer"
            responseTime: 0
          })
        });
      }
      
      console.log('Flashcard exercise completed successfully');
      // Navigate back without alert, like other exercises
      navigation.navigate('TrailSteps', { category });
      
    } catch (error) {
      console.error('Error updating completion:', error);
      // Still navigate back even if there's an error
      navigation.navigate('TrailSteps', { category });
    }
  };

  const getCurrentCard = () => {
    return vocabularyData[currentCardIndex];
  };

  const getRemainingCards = () => {
    return vocabularyData.filter(vocab => !dismissedCards.has(vocab.id));
  };

  const getNextCardIndex = () => {
    const remaining = getRemainingCards();
    if (remaining.length === 0) return -1;
    
    const currentVocab = vocabularyData[currentCardIndex];
    const currentIndexInRemaining = remaining.findIndex(vocab => vocab.id === currentVocab.id);
    const nextIndexInRemaining = (currentIndexInRemaining + 1) % remaining.length;
    const nextVocab = remaining[nextIndexInRemaining];
    
    return vocabularyData.findIndex(vocab => vocab.id === nextVocab.id);
  };

  const renderCountdown = () => (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownTitle}>Get Ready!</Text>
      <Text style={styles.countdownNumber}>{countdown}</Text>
      <Text style={styles.countdownSubtitle}>
        {countdown > 0 ? 'Review vocabulary cards...' : 'Go!'}
      </Text>
    </View>
  );

  const renderGameplay = () => {
    const remainingCards = getRemainingCards();
    
    if (remainingCards.length === 0) {
      return (
        <View style={styles.gameplayContainer}>
          <Text style={styles.completionText}>All cards learned!</Text>
        </View>
      );
    }

    const currentVocab = vocabularyData[currentCardIndex];
    const isFlipped = cardFlipped[currentVocab.id];
    const showNative = cardRandomSide[currentVocab.id];
    const fadeAnim = flipAnimations.get(currentVocab.id);

    return (
      <View style={styles.gameplayContainer}>
        {/* Header with Progress */}
        <View style={styles.gameHeader}>
          <Text style={styles.progress}>
            {remainingCards.length} cards remaining
          </Text>
          <Text style={styles.cardCounter}>
            {dismissedCards.size} learned
          </Text>
        </View>

        {/* Auto-advance Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.autoAdvanceToggle}>
            <Text style={styles.toggleLabel}>
              {isCountingDown ? `Auto-advance in: ${autoAdvanceCountdown}s` : 'Auto-advance'}
            </Text>
            <Switch
              value={autoAdvanceEnabled}
              onValueChange={setAutoAdvanceEnabled}
              trackColor={{false: '#767577', true: '#007AFF'}}
              thumbColor={autoAdvanceEnabled ? '#f4f3f4' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Single Large Card */}
        <View style={styles.singleCardContainer}>
          <Animated.View style={[
            styles.cardTransitionContainer,
            { transform: [{ translateX: cardTransitionAnim }] }
          ]}>
            <TouchableOpacity
              style={styles.singleCard}
              onPress={() => handleCardPress(currentVocab.id)}
              activeOpacity={0.8}
            >
              <Animated.View style={[styles.cardContent, { opacity: fadeAnim }]}>
                <Text style={styles.largeCardText}>
                  {isFlipped 
                    ? (showNative ? currentVocab.targetWord : currentVocab.nativeWord)
                    : (showNative ? currentVocab.nativeWord : currentVocab.targetWord)
                  }
                </Text>
                {((isFlipped && showNative) || (!isFlipped && !showNative)) && currentVocab.pronunciation && (
                  <Text style={styles.largePronunciationText}>
                    {currentVocab.pronunciation}
                  </Text>
                )}
              </Animated.View>
              
              {/* Flip indicator */}
              <View style={styles.flipIndicator}>
                <Text style={styles.flipIndicatorText}>
                  Tap to {isFlipped ? 'flip back' : 'see translation'} {isFlipped ? (showNative ? '🇺🇸' : '🇨🇳') : (showNative ? '🇨🇳' : '🇺🇸')}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, styles.skipButton]}
            onPress={skipCard}
          >
            <Text style={styles.skipButtonText}>Skip (Learned)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={moveToNextCard}
          >
            <Text style={styles.nextButtonText}>Next Card</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(dismissedCards.size / vocabularyData.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {dismissedCards.size}/{vocabularyData.length} cards learned
          </Text>
        </View>
      </View>
    );
  };

  // Error state
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorText}>Missing exercise parameters. Please try again.</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.navigate('TrailSteps', { category })}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (gameState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Preparing flashcards...</Text>
      </View>
    );
  }

  // Countdown state
  if (gameState === 'countdown') {
    return renderCountdown();
  }

  // Gameplay state
  return renderGameplay();
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  countdownTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  countdownSubtitle: {
    fontSize: 18,
    color: '#666',
  },
  gameplayContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,  
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  cardCounter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  controlsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  autoAdvanceToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  countdownDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  singleCardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  cardTransitionContainer: {
    width: '100%',
  },
  singleCard: {
    width: '100%',
    minHeight: 250,
    maxHeight: 350,
    borderRadius: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  flagContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  flagIcon: {
    fontSize: 24,
  },
  largeCardText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  largePronunciationText: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flipIndicator: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
  },
  flipIndicatorText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
  },
  navButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  nextButton: {
    backgroundColor: '#007AFF',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
});

export default VocabularyFlashcardsGame;