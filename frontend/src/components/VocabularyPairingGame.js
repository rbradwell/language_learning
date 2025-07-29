// src/components/VocabularyPairingGame.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Vibration,
  ScrollView,
  Dimensions,
} from 'react-native';
import AuthService from '../services/authService';
import FeedbackAnimation from './FeedbackAnimation';

const { width: screenWidth } = Dimensions.get('window');

const VocabularyPairingGame = ({ route, navigation }) => {
  const { trailStep, category } = route?.params || {};
  
  // Game states
  const [gameState, setGameState] = useState('loading'); // loading, countdown, playing, completed
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [gameTimer, setGameTimer] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [exerciseSession, setExerciseSession] = useState(null);
  const [vocabularyData, setVocabularyData] = useState([]);
  const [score, setScore] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [fetchingProgressData, setFetchingProgressData] = useState(false);
  const [updatedStepData, setUpdatedStepData] = useState(null);
  const [nextExercise, setNextExercise] = useState(null);
  
  // Pairing game specific states
  const [selectedNative, setSelectedNative] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [pairedWords, setPairedWords] = useState(new Set());
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null);
  const [shuffledTargetWords, setShuffledTargetWords] = useState([]);
  const [animatingPairs, setAnimatingPairs] = useState(new Set());
  
  // Animation refs
  const countdownInterval = useRef(null);
  const gameTimerInterval = useRef(null);
  const isMountedRef = useRef(true);
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const wordAnimations = useRef(new Map()).current;

  useEffect(() => {
    const initializeGame = async () => {
      console.log('=== VocabularyPairingGame MOUNTED ===');
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
      if (gameTimerInterval.current) clearInterval(gameTimerInterval.current);
    };
  }, []);

  const findAndStartExercise = async () => {
    try {
      console.log('Finding vocabulary pairing exercise...');
      
      const response = await AuthService.authenticatedFetch('/exercises/trail-steps-progress');
      const data = await response.json();
      
      console.log('API response:', data);
      
      if (data.success) {
        const categoryData = data.data.find(cat => cat.id === category.id);
        const stepData = categoryData?.trailSteps.find(ts => ts.id === trailStep.id);
        
        console.log('stepData:', stepData);
        console.log('stepData.exercises:', stepData?.exercises);
        
        if (stepData?.exercises && stepData.exercises.length > 0) {
          console.log('All available exercises for this step:', stepData.exercises);
          
          const notAttemptedExercises = stepData.exercises.filter(ex => ex.exerciseStatus === 'not_attempted');
          const inProgressExercises = stepData.exercises.filter(ex => ex.exerciseStatus === 'in_progress');
          const failedExercises = stepData.exercises.filter(ex => ex.exerciseStatus === 'completed' && !ex.passed);
          
          console.log('Not attempted exercises:', notAttemptedExercises);
          console.log('In progress exercises:', inProgressExercises);
          console.log('Failed exercises:', failedExercises);
          
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
            Alert.alert('Exercise Complete', 'All vocabulary pairing exercises have been completed!', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        } else {
          Alert.alert('No Exercises', 'This step doesn\'t have any exercises available.');
          navigation.goBack();
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
      setGameTimer(0);
      
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
        setTotalPairs(data.session.totalQuestions);
        setScore(0);
        
        // Shuffle the target words to make the game challenging
        const shuffled = [...vocabulary].sort(() => Math.random() - 0.5);
        setShuffledTargetWords(shuffled);
        
        // Initialize animation values for each word
        vocabulary.forEach(vocab => {
          if (!wordAnimations.has(vocab.id)) {
            wordAnimations.set(vocab.id, {
              opacity: new Animated.Value(1),
              scale: new Animated.Value(1)
            });
          }
        });
        
        // Start game timer
        gameTimerInterval.current = setInterval(() => {
          setGameTimer(prev => prev + 1);
        }, 1000);
      } else {
        throw new Error(data.message || 'Failed to start exercise');
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      Alert.alert('Error', 'Failed to start exercise');
    }
  };

  const handleNativeWordPress = (vocab) => {
    if (pairedWords.has(vocab.id)) return; // Already paired
    
    if (selectedNative?.id === vocab.id) {
      // Unselect if clicking same word
      setSelectedNative(null);
    } else {
      // Select new native word
      setSelectedNative(vocab);
      setSelectedTarget(null); // Clear target selection
    }
  };

  const handleTargetWordPress = (vocab) => {
    if (pairedWords.has(vocab.id)) return; // Already paired
    
    if (selectedTarget?.id === vocab.id) {
      // Unselect if clicking same word
      setSelectedTarget(null);
    } else {
      // Select new target word
      setSelectedTarget(vocab);
      
      // If we also have a native word selected, check for match
      if (selectedNative) {
        checkMatch(selectedNative, vocab);
      }
    }
  };

  const checkMatch = async (nativeVocab, targetVocab) => {
    const isCorrect = nativeVocab.id === targetVocab.id;
    
    try {
      const response = await AuthService.authenticatedFetch('/exercises/submit-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: exerciseSession.id,
          vocabularyId: nativeVocab.id,
          userAnswer: targetVocab.targetWord,
          exerciseDirection: 'native_to_target'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.isCorrect) {
          // Correct match
          showFeedback('correct');
          setScore(data.currentScore);
          
          // Clear selections
          setSelectedNative(null);
          setSelectedTarget(null);
          
          // Animate words disappearing
          setTimeout(() => {
            animateWordDisappear(nativeVocab.id);
          }, 500); // Wait for feedback to show
          
          // Check if exercise complete
          if (data.sessionComplete) {
            setTimeout(() => {
              completeExercise(data.currentScore);
            }, 2000); // Give time for animation to complete
          }
        } else {
          // Incorrect match
          showFeedback('incorrect');
          Vibration.vibrate(200);
          
          // Clear selections after feedback
          setTimeout(() => {
            setSelectedNative(null);
            setSelectedTarget(null);
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      Alert.alert('Error', 'Failed to submit answer');
    }
  };

  const animateWordDisappear = (vocabularyId) => {
    const animations = wordAnimations.get(vocabularyId);
    if (!animations) return;

    setAnimatingPairs(prev => new Set([...prev, vocabularyId]));

    Animated.parallel([
      Animated.timing(animations.opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(animations.scale, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After animation completes, add to paired words and remove from animating
      setPairedWords(prev => new Set([...prev, vocabularyId]));
      setAnimatingPairs(prev => {
        const newSet = new Set(prev);
        newSet.delete(vocabularyId);
        return newSet;
      });
    });
  };

  const showFeedback = (type) => {
    setFeedbackType(type);
    setFeedbackVisible(true);
    
    Animated.parallel([
      Animated.spring(feedbackScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(feedbackScale, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFeedbackVisible(false);
      });
    }, 1000);
  };

  const completeExercise = async (finalScore) => {
    if (gameTimerInterval.current) {
      clearInterval(gameTimerInterval.current);
    }
    
    setGameState('completed');
    setScore(finalScore);
    
    // Update completion time in backend
    try {
      await AuthService.authenticatedFetch('/exercises/complete-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: exerciseSession.id,
          completionTime: gameTimer
        })
      });
    } catch (error) {
      console.log('Error updating completion time:', error);
    }
    
    // Fetch updated progress data and find next exercise
    setFetchingProgressData(true);
    await fetchUpdatedProgressData();
    setFetchingProgressData(false);
  };

  const fetchUpdatedProgressData = async () => {
    try {
      const response = await AuthService.authenticatedFetch('/exercises/trail-steps-progress');
      const data = await response.json();
      
      if (data.success) {
        const categoryData = data.data.find(cat => cat.id === category.id);
        const stepData = categoryData?.trailSteps.find(ts => ts.id === trailStep.id);
        
        if (stepData?.exercises) {
          // Store updated step data for the completion screen
          setUpdatedStepData(stepData);
          
          // Find next unattempted exercise in current step
          const unattemptedExercise = stepData.exercises.find(ex => 
            (ex.exerciseStatus === 'not_attempted' || (ex.exerciseStatus === 'completed' && !ex.passed)) && 
            ex.id !== currentExercise.id
          );
          setNextExercise(unattemptedExercise);
          
          // Check if current step is complete (all exercises passed)
          const allExercisesPassed = stepData.exercises.every(ex => ex.passed);
          
          // If current step is complete, find next step in category
          if (allExercisesPassed) {
            const currentStepNumber = trailStep.stepNumber;
            const nextStep = categoryData?.trailSteps?.find(step => 
              step.stepNumber === currentStepNumber + 1 && step.isUnlocked
            );
            
            // Store next step data
            if (nextStep) {
              setUpdatedStepData({
                ...stepData,
                isComplete: true,
                nextStep: nextStep
              });
            } else {
              setUpdatedStepData({
                ...stepData,
                isComplete: true,
                nextStep: null
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching updated progress data:', error);
    }
  };

  const startNextExercise = () => {
    if (nextExercise) {
      console.log('Starting next exercise:', nextExercise);
      setCurrentExercise(nextExercise);
      setGameTimer(0);
      setScore(0);
      setPairedWords(new Set());
      setSelectedNative(null);
      setSelectedTarget(null);
      setAnimatingPairs(new Set());
      startCountdown(nextExercise);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCountdown = () => (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownTitle}>Get Ready!</Text>
      <Text style={styles.countdownNumber}>{countdown}</Text>
      <Text style={styles.countdownSubtitle}>
        {countdown > 0 ? 'Match the words...' : 'Go!'}
      </Text>
    </View>
  );

  const renderGameplay = () => (
    <View style={styles.gameplayContainer}>
      {/* Header */}
      <View style={styles.gameHeader}>
        <Text style={styles.timer}>Time: {formatTime(gameTimer)}</Text>
        <Text style={styles.progress}>
          {score} / {totalPairs} pairs
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap an English word, then tap its Chinese translation
        </Text>
      </View>

      <ScrollView style={styles.wordsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.columnsContainer}>
          {/* Native Words Column */}
          <View style={styles.columnContainer}>
            <Text style={styles.columnTitle}>English</Text>
            {vocabularyData.map((vocab) => {
              const isPaired = pairedWords.has(vocab.id);
              const isAnimating = animatingPairs.has(vocab.id);
              const isSelected = selectedNative?.id === vocab.id;
              const animations = wordAnimations.get(vocab.id);
              
              if (isPaired && !isAnimating) return null; // Hide completely paired words
              
              return (
                <Animated.View
                  key={`native-${vocab.id}`}
                  style={[
                    {
                      opacity: animations?.opacity || 1,
                      transform: [
                        { scale: animations?.scale || 1 }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.wordButton,
                      styles.nativeWordButton,
                      isPaired && styles.pairedWordButton,
                      isSelected && styles.selectedWordButton,
                      isPaired && styles.disabledWordButton
                    ]}
                    onPress={() => handleNativeWordPress(vocab)}
                    disabled={isPaired || isAnimating}
                    activeOpacity={isPaired ? 1 : 0.7}
                  >
                    <Text style={[
                      styles.wordText,
                      isPaired && styles.pairedWordText,
                      isSelected && styles.selectedWordText
                    ]}>
                      {vocab.nativeWord}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Target Words Column (Shuffled) */}
          <View style={styles.columnContainer}>
            <Text style={styles.columnTitle}>Chinese</Text>
            {shuffledTargetWords.map((vocab) => {
              const isPaired = pairedWords.has(vocab.id);
              const isAnimating = animatingPairs.has(vocab.id);
              const isSelected = selectedTarget?.id === vocab.id;
              const animations = wordAnimations.get(vocab.id);
              
              if (isPaired && !isAnimating) return null; // Hide completely paired words
              
              return (
                <Animated.View
                  key={`target-${vocab.id}`}
                  style={[
                    {
                      opacity: animations?.opacity || 1,
                      transform: [
                        { scale: animations?.scale || 1 }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.wordButton,
                      styles.targetWordButton,
                      isPaired && styles.pairedWordButton,
                      isSelected && styles.selectedWordButton,
                      isPaired && styles.disabledWordButton
                    ]}
                    onPress={() => handleTargetWordPress(vocab)}
                    disabled={isPaired || isAnimating}
                    activeOpacity={isPaired ? 1 : 0.7}
                  >
                    <Text style={[
                      styles.wordText,
                      isPaired && styles.pairedWordText,
                      isSelected && styles.selectedWordText
                    ]}>
                      {vocab.targetWord}
                    </Text>
                    {vocab.pronunciation && (
                      <Text style={[
                        styles.pronunciationText,
                        isPaired && styles.pairedWordText,
                        isSelected && styles.selectedWordText
                      ]}>
                        ({vocab.pronunciation})
                      </Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Feedback Animation */}
      {feedbackVisible && (
        <Animated.View
          style={[
            styles.feedbackContainer,
            {
              transform: [{ scale: feedbackScale }],
              opacity: feedbackOpacity,
            },
          ]}
          pointerEvents="none"
        >
          <View style={[
            styles.feedbackBubble,
            feedbackType === 'correct' ? styles.correctFeedback : styles.incorrectFeedback
          ]}>
            <Text style={styles.feedbackIcon}>
              {feedbackType === 'correct' ? '✓' : '✗'}
            </Text>
            <Text style={styles.feedbackText}>
              {feedbackType === 'correct' ? 'Correct!' : 'Try Again!'}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );

  const renderCompletion = () => {
    // Show loading state while fetching progress data
    if (fetchingProgressData) {
      return (
        <View style={styles.completionContainer}>
          <View style={styles.completionContent}>
            <Text style={styles.congratsTitle}>Congratulations!</Text>
            <Text style={styles.completionTime}>Time: {formatTime(gameTimer)}</Text>
            <View style={styles.loadingProgressContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingProgressText}>Updating progress...</Text>
            </View>
          </View>
        </View>
      );
    }

    // Use updated step data if available, otherwise fall back to route params
    const currentStepData = updatedStepData || route?.params?.stepData;
    const totalExercisesInStep = currentStepData?.exercises?.length || 0;
    const completedExercises = currentStepData?.exercises?.filter(ex => ex.passed).length || 0;
    const remainingExercises = totalExercisesInStep - completedExercises;
    const isStepComplete = currentStepData?.isComplete || remainingExercises === 0;
    const nextStep = currentStepData?.nextStep;
    
    return (
      <View style={styles.completionContainer}>
        <View style={styles.completionContent}>
          <Text style={styles.congratsTitle}>
            {isStepComplete ? 'Step Complete!' : 'Congratulations!'}
          </Text>
          <Text style={styles.completionTime}>
            Time: {formatTime(gameTimer)}
          </Text>
          
          {/* Progress Information */}
          {isStepComplete ? (
            <View style={styles.stepCompleteInfo}>
              <Text style={styles.stepCompleteText}>
                🎉 You've completed all exercises in "{trailStep?.name}"!
              </Text>
              {nextStep ? (
                <Text style={styles.nextStepUnlockedText}>
                  ✨ Next step "{nextStep.name}" is now unlocked!
                </Text>
              ) : (
                <Text style={styles.trailCompleteText}>
                  🏆 You've completed this entire trail!
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.progressInfo}>
              {remainingExercises > 0 
                ? `${remainingExercises} exercise${remainingExercises === 1 ? '' : 's'} remaining in ${trailStep?.name}`
                : `All exercises completed in ${trailStep?.name}!`
              }
            </Text>
          )}
          
          {/* Action Buttons */}
          {nextExercise && !isStepComplete ? (
            <View style={styles.nextExerciseContainer}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={startNextExercise}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.allCompleteContainer}>
              {isStepComplete && nextStep ? (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => {
                      // Navigate to the next step
                      navigation.navigate('TrailSteps', {
                        category: category,
                        highlightStepId: nextStep.id
                      });
                    }}
                  >
                    <Text style={styles.primaryButtonText}>Next Step</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => navigation.goBack()}
                  >
                    <Text style={styles.secondaryButtonText}>Back to Steps</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
          onPress={() => navigation.goBack()}
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
        <Text style={styles.loadingText}>Preparing vocabulary pairing...</Text>
      </View>
    );
  }

  // Countdown state
  if (gameState === 'countdown') {
    return renderCountdown();
  }

  // Completion state
  if (gameState === 'completed') {
    return renderCompletion();
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
    padding: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progress: {
    fontSize: 16,
    color: '#666',
  },
  instructionsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  wordsContainer: {
    flex: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  columnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  wordButton: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 64,
    justifyContent: 'center',
  },
  nativeWordButton: {
    marginRight: 4,
  },
  targetWordButton: {
    marginLeft: 4,
  },
  selectedWordButton: {
    backgroundColor: '#007AFF',
    borderWidth: 2,
    borderColor: '#005CBF',
  },
  pairedWordButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  disabledWordButton: {
    opacity: 0.6,
  },
  wordText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  selectedWordText: {
    color: 'white',
  },
  pairedWordText: {
    color: '#4CAF50',
  },
  pronunciationText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  feedbackContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  feedbackBubble: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  correctFeedback: {
    backgroundColor: '#4CAF50',
  },
  incorrectFeedback: {
    backgroundColor: '#F44336',
  },
  feedbackIcon: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  completionContainer: {
    flex: 1,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContent: {
    alignItems: 'center',
    padding: 30,
  },
  congratsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  completionTime: {
    fontSize: 20,
    color: 'white',
    marginBottom: 30,
  },
  loadingProgressContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingProgressText: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
  },
  stepCompleteInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  stepCompleteText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  nextStepUnlockedText: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
  trailCompleteText: {
    fontSize: 16,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '600',
  },
  progressInfo: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  nextExerciseContainer: {
    alignItems: 'center',
  },
  allCompleteContainer: {
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: 'white',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default VocabularyPairingGame;