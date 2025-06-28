// src/components/TrailStepsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AuthService from '../services/authService';
import LilyPad from './svg/TrailIcons/LilyPad';
import LilyPadWithFrog from './svg/TrailIcons/LilyPadWithFrog';
import LilyPond from './svg/TrailIcons/LilyPond';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TrailStepsScreen = ({ route, navigation }) => {
  const { category } = route?.params || {};
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (category) {
      navigation.setOptions({
        title: category.name,
      });
      fetchTrailSteps();
    }
  }, [category]);

  // Refresh data when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      fetchTrailSteps();
    }, [])
  );

  const fetchTrailSteps = async () => {
    try {
      const response = await AuthService.authenticatedFetch('/exercises/trail-steps-progress');

      const data = await response.json();
      if (data.success) {
        // Find the specific category data
        const categoryDetails = data.data.find(cat => cat.id === category.id);
        setCategoryData(categoryDetails);
      } else {
        Alert.alert('Error', data.message || 'Failed to load trail steps');
      }
    } catch (error) {
      console.error('Error fetching trail steps:', error);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getStepStonePosition = (stepNumber, totalSteps, availableHeight) => {
    // Create natural lily pad positions that stay within bounds
    const verticalVariation = 15; // Slightly increased for natural look
    const horizontalVariation = 100; // Increased for better spread
    const topMargin = 60; // Increased for larger lily pads
    const bottomMargin = 100; // Increased for larger lily pads and labels
    const sideMargin = 60; // Increased for larger lily pads
    
    // Calculate available space for lily pads
    const usableHeight = availableHeight - topMargin - bottomMargin;
    const usableWidth = screenWidth - (sideMargin * 2); // Account for side margins
    
    // Ensure good spacing for larger lily pads
    const maxSpacing = Math.min(usableHeight / Math.max(totalSteps - 1, 1), 120); // Increased cap
    const idealSpacing = totalSteps > 1 ? usableHeight / (totalSteps - 1) : 0;
    const baseSpacing = Math.min(idealSpacing, maxSpacing);
    
    // Calculate position with proper spacing for larger pads
    const baseY = topMargin + ((stepNumber - 1) * baseSpacing);
    
    // Simplified horizontal positioning - keep lily pads well within bounds
    const lilyPadRadius = 48; // Half of 96px lily pad width
    const pondMargin = 20; // Additional safety margin
    const centerX = screenWidth / 2;
    const maxSafeOffset = (screenWidth / 2) - lilyPadRadius - pondMargin - sideMargin;
    
    const horizontalOffset = (stepNumber % 3 === 0) ? -maxSafeOffset * 0.8 : 
                           (stepNumber % 3 === 1) ? maxSafeOffset * 0.8 : 
                           0; // Center
    
    const verticalOffset = Math.sin(stepNumber * 1.2) * verticalVariation;
    
    // Add natural lily pad variations
    const rotation = (stepNumber * 23) % 120 - 60; // Keep same rotation range
    const scale = 0.85 + (stepNumber * 0.06) % 0.3; // Slightly more size variation
    
    return {
      x: centerX + horizontalOffset,
      y: baseY + verticalOffset,
      horizontalOffset: horizontalOffset,
      rotation: rotation,
      scale: scale,
    };
  };

  const renderSteppingStone = (trailStep, stepIndex, trail, availableHeight) => {
    const position = getStepStonePosition(trailStep.stepNumber, trail.trailStepsCount, availableHeight);
    const isUnlocked = trailStep.isUnlocked;
    const hasExercises = trailStep.exercisesCount > 0;
    const horizontalOffset = position.horizontalOffset;
    
    // Debug logging - remove when working
    // console.log(`Step ${trailStep.stepNumber}: position.x=${position.x}, screenWidth=${screenWidth}, horizontalOffset=${position.horizontalOffset}`);
    
    // Calculate completion status
    const completedExercises = trailStep.exercises?.filter(ex => ex.passed).length || 0;
    const totalExercises = trailStep.exercisesCount || 0;
    const isCompleted = completedExercises === totalExercises && totalExercises > 0;
    const isPartiallyCompleted = completedExercises > 0 && completedExercises < totalExercises;
    
    // Determine if this step should show a frog (next step to work on)
    // Find the first step that's unlocked but not completed
    const allSteps = trail.trailSteps || [];
    const firstIncompleteStep = allSteps.find(step => {
      const stepCompleted = (step.exercises?.filter(ex => ex.passed).length || 0);
      const stepTotal = step.exercisesCount || 0;
      return step.isUnlocked && stepTotal > 0 && stepCompleted < stepTotal;
    });
    const isNextStep = firstIncompleteStep?.id === trailStep.id;

    const handleStepPress = () => {
      if (!isUnlocked) {
        Alert.alert('Locked', 'Complete previous steps to unlock this one');
        return;
      }
      
      if (!hasExercises) {
        Alert.alert('Coming Soon', 'This step has no exercises yet');
        return;
      }

      console.log('Navigating with params:', {
        trailStep: trailStep,
        trail: trail,
        category: category
      });

      // Navigate to exercises for this trail step
      navigation.navigate('TrailStepExercises', {
        trailStep: trailStep,
        trail: trail,
        category: category
      });
    };

    return (
      <TouchableOpacity
        key={trailStep.id}
        style={[
          styles.steppingStone,
          {
            left: position.x - 48, // Center the lily pad (96/2)
            top: position.y,
          },
        ]}
        onPress={handleStepPress}
        disabled={!isUnlocked}
        activeOpacity={isUnlocked ? 0.7 : 1}
      >
        {/* Lily Pad Container - gets transformed */}
        <View style={[
          styles.lilyPadContainer,
          {
            transform: [
              { rotate: `${position.rotation}deg` },
              { scale: position.scale },
            ]
          }
        ]}>
          {isNextStep ? (
            <LilyPadWithFrog 
              width={96} 
              height={96}
              isCompleted={isCompleted}
              isUnlocked={isUnlocked}
              isPartiallyCompleted={isPartiallyCompleted}
              style={styles.lilyPadSvg}
            />
          ) : (
            <LilyPad 
              width={96} 
              height={96}
              isCompleted={isCompleted}
              isUnlocked={isUnlocked}
              isPartiallyCompleted={isPartiallyCompleted}
              style={styles.lilyPadSvg}
            />
          )}
        </View>
        
        {/* Status indicators only */}
        <View style={styles.stoneContent}>          
          {isCompleted && (
            <View style={styles.statusIndicator}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          )}
          
          {isPartiallyCompleted && (
            <View style={styles.statusIndicator}>
              <Text style={styles.progress}>
                {completedExercises}/{totalExercises}
              </Text>
            </View>
          )}
        </View>
        
        {isNextStep && (
          <View style={[
            styles.stepLabel,
            horizontalOffset > 0 ? styles.stepLabelLeft : styles.stepLabelRight
          ]}>
            <Text style={[
              styles.stepName,
              styles.textUnlocked
            ]}>
              {trailStep.name}
            </Text>
            {totalExercises > 0 && (
              <Text style={[
                styles.exerciseCount,
                styles.textUnlocked
              ]}>
                {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        )}
        
      </TouchableOpacity>
    );
  };

  const renderTrail = (trail) => {
    if (!trail.trailSteps || trail.trailSteps.length === 0) {
      return (
        <View key={trail.id} style={styles.emptyTrail}>
          <Text style={styles.emptyTrailText}>No steps available in this trail yet</Text>
        </View>
      );
    }

    // Calculate progress information
    const completedSteps = trail.trailSteps.filter(step => {
      const completedExercises = step.exercises.filter(ex => ex.passed).length;
      return completedExercises === step.exercises.length && step.exercises.length > 0;
    }).length;
    
    const nextOpenStep = trail.trailSteps.find(step => {
      const completedExercises = step.exercises.filter(ex => ex.passed).length;
      return step.isUnlocked && (completedExercises < step.exercises.length || step.exercises.length === 0);
    });

    return (
      <View key={trail.id} style={styles.trailContainer}>
        {/* Lily Pond Background - fills remaining space */}
        <View style={styles.pondBackground}>
          <View style={styles.pondSvg}>
            <LilyPond 
              width="100%" 
              height="100%"
            />
          </View>
          
          {trail.trailSteps.map((trailStep, stepIndex) => 
            renderSteppingStone(trailStep, stepIndex, trail, screenHeight - 140)
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trail steps...</Text>
      </View>
    );
  }

  if (!categoryData || !categoryData.trails || categoryData.trails.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Trails Available</Text>
        <Text style={styles.emptyText}>
          This category doesn't have any learning trails yet.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back to Categories</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{category?.name || 'Loading...'}</Text>
            <Text style={styles.headerSubtitle}>
              Complete each step to master this category
            </Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {categoryData.trails.map(renderTrail)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6f3ff', // Light blue background like water
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f3ff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e6f3ff',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  progressStat: {
    alignItems: 'center',
    flex: 1,
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  nextStepName: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  trailContainer: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trailHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  trailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  trailInfo: {
    fontSize: 14,
    color: '#666',
  },
  pondBackground: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    bottom: 0,
    overflow: 'visible',
  },
  pondSvg: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  pondSvgDirect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  steppingStone: {
    position: 'absolute',
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 10,
  },
  lilyPadContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  lilyPadSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stoneContent: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 15,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textLocked: {
    color: '#666666',
  },
  textUnlocked: {
    color: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progress: {
    color: '#FF9800',
    fontSize: 8,
    fontWeight: 'bold',
  },
  stepLabel: {
    position: 'absolute',
    top: 20,
    width: 100,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 12,
  },
  stepLabelLeft: {
    right: 50,
  },
  stepLabelRight: {
    left: 50,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  exerciseCount: {
    fontSize: 12,
    textAlign: 'center',
  },
  textUnlockedSecondary: {
    color: '#2E7D32',
  },
  textLockedSecondary: {
    color: '#999999',
  },
  connectionLine: {
    position: 'absolute',
    top: 80,
    left: 38,
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  lineUnlocked: {
    backgroundColor: '#4CAF50',
  },
  lineLocked: {
    backgroundColor: '#cccccc',
  },
  emptyTrail: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTrailText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 50,
  },
});

export default TrailStepsScreen;