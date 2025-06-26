// src/components/VocabularyMatchingGame.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Vibration,
} from 'react-native';
import AuthService from '../services/authService';

const VocabularyMatchingGame = ({ route, navigation }) => {
  const { trailStep, trail, category } = route?.params || {};
  
  // Game states
  const [gameState, setGameState] = useState('loading'); // loading, countdown, playing, completed
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [gameTimer, setGameTimer] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [exerciseSession, setExerciseSession] = useState(null);
  const [vocabularyData, setVocabularyData] = useState([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState(new Set());
  const [nextExercise, setNextExercise] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [updatedStepData, setUpdatedStepData] = useState(null);
  
  // Animation refs
  const feedbackScale = useRef(new Animated.Value(0)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const [feedbackType, setFeedbackType] = useState(null); // 'correct' or 'incorrect'
  
  // Timer refs
  const countdownInterval = useRef(null);
  const gameTimerInterval = useRef(null);
  const exerciseRef = useRef(null);

  useEffect(() => {
    const initializeGame = async () => {
      // Check if we have the required parameters
      if (!trailStep || !trail || !category) {
        console.error('Missing required parameters:', { trailStep, trail, category });
        setHasError(true);
        return;
      }

      loadSounds();
      findNextExercise();
    };

    initializeGame();
    
    return () => {
      // Cleanup
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (gameTimerInterval.current) clearInterval(gameTimerInterval.current);
      unloadSounds();
    };
  }, []);

  const loadSounds = async () => {
    try {
      // For now, we'll use Vibration for feedback
      // In a real app, you'd load actual sound files
      console.log('Sound system initialized');
    } catch (error) {
      console.log('Error loading sounds:', error);
    }
  };

  const unloadSounds = async () => {
    try {
      // Cleanup if needed
      console.log('Sound system cleaned up');
    } catch (error) {
      console.log('Error unloading sounds:', error);
    }
  };

  const playSound = async (type) => {
    try {
      if (type === 'correct') {
        // For correct answers, use a short vibration
        Vibration.vibrate(100);
      } else if (type === 'incorrect') {
        // For incorrect answers, use a longer vibration pattern
        Vibration.vibrate([0, 200, 100, 200]);
      }
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const findNextExercise = async () => {
    try {
      setLoading(true);
      
      // Find the next unattempted exercise in this trail step
      const response = await AuthService.makeAuthenticatedRequest(
        'http://192.168.0.27:8080/api/exercises/trail-steps-progress'
      );

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.success) {
        const categoryData = data.data.find(cat => cat.id === category.id);
        console.log('Category Data:', categoryData);
        
        const trailData = categoryData?.trails.find(t => t.id === trail.id);
        console.log('Trail Data:', trailData);
        
        const stepData = trailData?.trailSteps.find(ts => ts.id === trailStep.id);
        console.log('Step Data:', stepData);
        
        if (stepData?.exercises && stepData.exercises.length > 0) {
          console.log('Available exercises:', stepData.exercises);
          
          // Find next exercise to attempt - prioritize in order:
          // 1. Not attempted exercises
          // 2. In progress exercises  
          // 3. Failed exercises that can be retried
          let unattemptedExercise = stepData.exercises.find(ex => ex.exerciseStatus === 'not_attempted');
          
          if (!unattemptedExercise) {
            unattemptedExercise = stepData.exercises.find(ex => ex.exerciseStatus === 'in_progress');
          }
          
          if (!unattemptedExercise) {
            unattemptedExercise = stepData.exercises.find(ex => 
              ex.exerciseStatus === 'completed' && !ex.passed
            );
          }
          
          console.log('Unattempted exercise:', unattemptedExercise);
          
          if (unattemptedExercise) {
            console.log('Setting current exercise:', unattemptedExercise);
            setCurrentExercise(unattemptedExercise);
            exerciseRef.current = unattemptedExercise; // Store in ref as backup
            startCountdown();
          } else {
            // All exercises completed - this will be handled by the completion screen
            console.log('All exercises in step completed');
            navigation.goBack();
          }
        } else {
          console.log('No exercises found in step data');
          Alert.alert(
            'No Exercises', 
            'This step doesn\'t have any exercises available yet.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        console.log('API call failed:', data.message);
        Alert.alert('Error', data.message || 'Failed to load exercises');
      }
    } catch (error) {
      console.error('Error finding next exercise:', error);
      Alert.alert('Error', 'Unable to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    console.log('Starting countdown');
    setGameState('countdown');
    setCountdown(5);
    
    countdownInterval.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          startExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startExercise = async () => {
    try {
      console.log('startExercise called, currentExercise:', currentExercise);
      console.log('exerciseRef.current:', exerciseRef.current);
      
      // Use ref as primary source to avoid state timing issues
      const exercise = exerciseRef.current || currentExercise;
      
      if (!exercise) {
        console.error('No current exercise available');
        Alert.alert(
          'Error', 
          'No exercise available to start',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      setGameState('playing');
      setGameTimer(0);
      
      console.log('Starting exercise:', exercise);
      
      const requestBody = {
        exerciseId: exercise.id,
        isRetry: exercise.exerciseStatus === 'completed'
      };
      console.log('Request body:', requestBody);
      console.log('Exercise object:', exercise);
      console.log('Exercise status:', exercise.exerciseStatus);
      console.log('Exercise passed:', exercise.passed);
      
      // Update state with the exercise we're using
      if (!currentExercise) {
        setCurrentExercise(exercise);
      }
      
      // Start exercise session
      const response = await AuthService.makeAuthenticatedRequest(
        'http://192.168.0.27:8080/api/exercises/start-exercise',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();
      console.log('Start exercise response:', data);
      
      if (data.success) {
        // Check if this is the correct exercise type
        if (data.exercise.type !== 'vocabulary_matching') {
          console.error('Wrong exercise type for VocabularyMatchingGame:', data.exercise.type);
          Alert.alert(
            'Exercise Type Error',
            `This exercise type (${data.exercise.type}) is not yet supported. Please try a different exercise.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        setExerciseSession(data.session);
        setVocabularyData(data.exercise.content.vocabulary);
        setTotalQuestions(data.session.totalQuestions);
        setCurrentQuestionIndex(0);
        setIncorrectAnswers(new Set());
        
        // Generate first question
        generateQuestion(data.exercise.content.vocabulary, 0, new Set());
        
        // Start game timer
        gameTimerInterval.current = setInterval(() => {
          setGameTimer(prev => prev + 1);
        }, 1000);
      } else {
        console.error('Backend error:', data);
        throw new Error(data.message || 'Failed to start exercise');
      }
    } catch (error) {
      console.error('Error starting exercise:', error);
      Alert.alert('Error', 'Failed to start exercise');
    }
  };

  const generateQuestion = (vocabulary, questionIndex, incorrectSet) => {
    if (questionIndex >= vocabulary.length) {
      return null;
    }

    const currentVocab = vocabulary[questionIndex];
    const correctAnswer = currentVocab.targetWord;
    
    // Get all other vocabulary items (excluding the current one) with their target words and pronunciations
    const otherVocabItems = vocabulary
      .filter((_, index) => index !== questionIndex)
      .filter(v => v.targetWord !== correctAnswer); // Ensure no duplicates
    
    // Randomly select 4 distractors
    const shuffledDistractors = [...otherVocabItems].sort(() => Math.random() - 0.5);
    const distractorItems = shuffledDistractors.slice(0, 4);
    
    // Ensure we have exactly 4 distractors (pad with placeholder if needed)
    while (distractorItems.length < 4) {
      distractorItems.push({ 
        targetWord: `Option ${distractorItems.length + 1}`, 
        pronunciation: '' 
      });
    }
    
    // Create options array with pronunciation: correct answer + 4 distractors, then shuffle
    const allOptions = [currentVocab, ...distractorItems];
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
    
    // Format options with pronunciation for display
    const optionsWithPronunciation = shuffledOptions.map(vocabItem => {
      const targetWord = vocabItem.targetWord;
      const pronunciation = vocabItem.pronunciation;
      
      // Add pronunciation in brackets for Mandarin characters
      return pronunciation ? `${targetWord} (${pronunciation})` : targetWord;
    });
    
    // Keep original target words for answer checking
    const originalOptions = shuffledOptions.map(vocabItem => vocabItem.targetWord);
    
    console.log('Generated question:');
    console.log('Native word:', currentVocab.nativeWord);
    console.log('Correct answer:', correctAnswer);
    console.log('Options with pronunciation:', optionsWithPronunciation);
    console.log('Original options:', originalOptions);
    console.log('Correct answer included?', originalOptions.includes(correctAnswer));
    
    const question = {
      vocabularyId: currentVocab.id,
      questionWord: currentVocab.nativeWord,
      correctAnswer: correctAnswer,
      options: originalOptions, // For answer checking
      optionsWithPronunciation: optionsWithPronunciation, // For display
      exerciseDirection: 'native_to_target'
    };
    
    setCurrentQuestion(question);
    return question;
  };

  const submitAnswer = async (selectedAnswer) => {
    try {
      console.log('Submitting answer:', {
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        vocabularyId: currentQuestion.vocabularyId,
        sessionId: exerciseSession?.id,
        exerciseDirection: currentQuestion.exerciseDirection
      });
      
      const response = await AuthService.makeAuthenticatedRequest(
        'http://192.168.0.27:8080/api/exercises/submit-answer',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: exerciseSession.id,
            vocabularyId: currentQuestion.vocabularyId,
            userAnswer: selectedAnswer,
            exerciseDirection: currentQuestion.exerciseDirection
          })
        }
      );

      const data = await response.json();
      console.log('Submit answer response:', data);
      if (data.success) {
        // Update score from server
        setScore(data.currentScore);
        
        if (data.isCorrect) {
          // Correct answer - show feedback and check if exercise is complete
          showFeedback('correct');
          playSound('correct');
          
          setTimeout(() => {
            if (data.sessionComplete) {
              completeExercise(data.currentScore, gameTimer);
            } else {
              // Generate next question - server will determine which vocabulary to show next
              generateNextQuestionFromServer();
            }
          }, 1500);
        } else {
          // Incorrect answer - show feedback but stay on same question
          showFeedback('incorrect');
          playSound('incorrect');
          // No advancement - user must answer correctly to proceed
        }
      } else if (data.shouldRestart && data.error === 'CONSTRAINT_ERROR') {
        // Handle constraint error by restarting exercise
        console.log('Constraint error detected, restarting exercise...');
        Alert.alert(
          'Exercise Restart Required',
          'There was a technical issue. The exercise will restart automatically.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Restart the exercise with retry flag
                if (currentExercise) {
                  const exerciseToRestart = { ...currentExercise, exerciseStatus: 'completed', passed: false };
                  setCurrentExercise(exerciseToRestart);
                  exerciseRef.current = exerciseToRestart;
                  startCountdown();
                }
              }
            }
          ]
        );
      } else {
        // Handle other errors
        console.error('Server error:', data);
        Alert.alert('Error', data.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      console.error('Error details:', error.message);
      Alert.alert('Error', `Failed to submit answer: ${error.message}`);
    }
  };

  const generateNextQuestionFromServer = () => {
    // For now, use the client-side logic, but ideally the server should tell us which question to show next
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < vocabularyData.length) {
      setCurrentQuestionIndex(nextIndex);
      generateQuestion(vocabularyData, nextIndex, incorrectAnswers);
    } else {
      // We've gone through all questions, but server says exercise isn't complete
      // This means we need to repeat some questions - start over
      setCurrentQuestionIndex(0);
      generateQuestion(vocabularyData, 0, incorrectAnswers);
    }
  };

  const moveToNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    
    // Check if we've gone through all questions
    if (nextIndex >= vocabularyData.length) {
      // Check if there are any incorrect answers to repeat
      if (incorrectAnswers.size > 0) {
        // Go back to first incorrect question
        const firstIncorrect = Math.min(...incorrectAnswers);
        setCurrentQuestionIndex(firstIncorrect);
        generateQuestion(vocabularyData, firstIncorrect, incorrectAnswers);
      } else {
        // All questions answered correctly, complete exercise
        completeExercise(score, gameTimer);
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(nextIndex);
      generateQuestion(vocabularyData, nextIndex, incorrectAnswers);
    }
  };

  const showFeedback = (type) => {
    setFeedbackType(type);
    
    // Reset animation values
    feedbackScale.setValue(0);
    feedbackOpacity.setValue(0);
    
    // Animate feedback
    Animated.parallel([
      Animated.spring(feedbackScale, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Hide feedback after delay
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(feedbackScale, {
          toValue: 0,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }, type === 'correct' ? 1200 : 800);
  };

  const completeExercise = async (finalScore, exerciseTime) => {
    if (gameTimerInterval.current) {
      clearInterval(gameTimerInterval.current);
    }
    
    setGameState('completed');
    setScore(finalScore);
    
    // Update completion time in backend
    try {
      await AuthService.makeAuthenticatedRequest(
        'http://192.168.0.27:8080/api/exercises/complete-exercise',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: exerciseSession.id,
            completionTime: exerciseTime
          })
        }
      );
    } catch (error) {
      console.log('Error updating completion time:', error);
    }
    
    // Fetch updated progress data and find next exercise
    await fetchUpdatedProgressData();
  };

  const fetchUpdatedProgressData = async () => {
    try {
      const response = await AuthService.makeAuthenticatedRequest(
        'http://192.168.0.27:8080/api/exercises/trail-steps-progress'
      );

      const data = await response.json();
      if (data.success) {
        const categoryData = data.data.find(cat => cat.id === category.id);
        const trailData = categoryData?.trails.find(t => t.id === trail.id);
        const stepData = trailData?.trailSteps.find(ts => ts.id === trailStep.id);
        
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
          
          // If current step is complete, find next step in trail
          if (allExercisesPassed) {
            const currentStepNumber = trailStep.stepNumber;
            const nextStep = trailData?.trailSteps?.find(step => 
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

  const findNextUnattemptedExercise = async () => {
    // This function is now replaced by fetchUpdatedProgressData
    await fetchUpdatedProgressData();
  };

  const startNextExercise = () => {
    if (nextExercise) {
      console.log('Starting next exercise:', nextExercise);
      console.log('Next exercise ID:', nextExercise.id);
      console.log('Next exercise status:', nextExercise.exerciseStatus);
      setCurrentExercise(nextExercise);
      exerciseRef.current = nextExercise; // Update ref too
      setGameTimer(0);
      setScore(0);
      setCurrentQuestionIndex(0);
      startCountdown();
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
        {countdown > 0 ? 'Starting in...' : 'Go!'}
      </Text>
    </View>
  );

  const renderGameplay = () => {
    if (!currentQuestion) return null;

    return (
      <View style={styles.gameplayContainer}>
        {/* Timer and Progress */}
        <View style={styles.gameHeader}>
          <Text style={styles.timer}>Time: {formatTime(gameTimer)}</Text>
          <Text style={styles.progress}>
            {currentQuestionIndex + 1} / {totalQuestions}
          </Text>
        </View>

        {/* Native Word */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionLabel}>Translate:</Text>
          <Text style={styles.nativeWord}>{currentQuestion.questionWord}</Text>
        </View>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {(currentQuestion.optionsWithPronunciation || currentQuestion.options).map((option, index) => {
            // Extract the original target word from the display text for answer submission
            const originalOption = currentQuestion.options ? currentQuestion.options[index] : option;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => submitAnswer(originalOption)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Animation */}
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
          {feedbackType === 'correct' ? (
            <View style={styles.correctFeedback}>
              <Text style={styles.feedbackIcon}>✓</Text>
              <Text style={styles.feedbackText}>Correct!</Text>
            </View>
          ) : (
            <View style={styles.incorrectFeedback}>
              <Text style={styles.feedbackIcon}>✗</Text>
              <Text style={styles.feedbackText}>Try Again</Text>
            </View>
          )}
        </Animated.View>
      </View>
    );
  };

  const renderCompletion = () => {
    // Use updated step data if available, otherwise fall back to route params
    const currentStepData = updatedStepData || route?.params?.stepData;
    const totalExercisesInStep = currentStepData?.exercises?.length || 0;
    const completedExercises = currentStepData?.exercises?.filter(ex => ex.passed).length || 0;
    const remainingExercises = totalExercisesInStep - completedExercises;
    const isStepComplete = currentStepData?.isComplete || remainingExercises === 0;
    const nextStep = currentStepData?.nextStep;
    
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.congratsTitle}>
          {isStepComplete ? 'Step Complete!' : 'Congratulations!'}
        </Text>
        <Text style={styles.completionTime}>
          Time: {formatTime(gameTimer)}
        </Text>
        <Text style={styles.completionScore}>
          Score: {score}/{totalQuestions}
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
        
        {nextExercise && !isStepComplete ? (
          <View style={styles.nextExerciseContainer}>
            <Text style={styles.nextExerciseText}>
              Would you like to start the next exercise?
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.secondaryButtonText}>No, Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={startNextExercise}
              >
                <Text style={styles.primaryButtonText}>Yes, Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.allCompleteContainer}>
            {isStepComplete && nextStep ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={() => {
                    // Navigate to the next step
                    navigation.navigate('TrailStepsScreen', {
                      trail: trail,
                      category: category,
                      highlightStepId: nextStep.id
                    });
                  }}
                >
                  <Text style={styles.primaryButtonText}>Next Step</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.primaryButtonText}>
                  {isStepComplete ? 'Back to Category' : 'Back to Steps'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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

  if (loading || gameState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Preparing exercise...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {gameState === 'countdown' && renderCountdown()}
      {gameState === 'playing' && renderGameplay()}
      {gameState === 'completed' && renderCompletion()}
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  countdownTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  countdownNumber: {
    fontSize: 120,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  countdownSubtitle: {
    fontSize: 24,
    color: 'white',
    opacity: 0.9,
  },
  gameplayContainer: {
    flex: 1,
    padding: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
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
  questionContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  questionLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  nativeWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  feedbackContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -75 }],
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 75,
  },
  correctFeedback: {
    backgroundColor: '#4CAF50',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incorrectFeedback: {
    backgroundColor: '#F44336',
    width: '100%',
    height: '100%',
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackIcon: {
    fontSize: 48,
    color: 'white',
    fontWeight: 'bold',
  },
  feedbackText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#4CAF50',
  },
  congratsTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
    textAlign: 'center',
  },
  completionTime: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
  },
  completionScore: {
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
  },
  progressInfo: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
    opacity: 0.9,
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
    fontWeight: 'bold',
  },
  nextStepUnlockedText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.9,
  },
  trailCompleteText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
    opacity: 0.9,
    fontWeight: 'bold',
  },
  nextExerciseContainer: {
    alignItems: 'center',
  },
  nextExerciseText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  allCompleteContainer: {
    alignItems: 'center',
  },
  allCompleteText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 12,
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VocabularyMatchingGame;