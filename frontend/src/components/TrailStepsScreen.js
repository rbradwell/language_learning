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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TrailStepsScreen = ({ route, navigation }) => {
  const { category } = route.params;
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: category.name,
    });
    fetchTrailSteps();
  }, []);

  // Refresh data when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      fetchTrailSteps();
    }, [])
  );

  const fetchTrailSteps = async () => {
    try {
      const token = await AuthService.getToken();
      const response = await fetch('http://192.168.0.27:8080/api/exercises/trail-steps-progress', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

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
    // Create natural stepping stone positions with varying alignment
    const verticalVariation = 20;
    const horizontalVariation = 50;
    const topMargin = 40; // Start stones away from the top edge
    const bottomMargin = 80; // Keep stones away from bottom edge
    
    // Calculate available space for stones
    const usableHeight = availableHeight - topMargin - bottomMargin;
    
    // Distribute stones evenly in the available height
    const baseSpacing = totalSteps > 1 ? usableHeight / (totalSteps - 1) : 0;
    const baseY = topMargin + ((stepNumber - 1) * baseSpacing);
    
    // Add natural variation based on step number
    const horizontalOffset = (stepNumber % 3 === 0) ? -horizontalVariation : 
                           (stepNumber % 3 === 1) ? horizontalVariation : 0;
    
    const verticalOffset = Math.sin(stepNumber * 0.8) * verticalVariation;
    
    return {
      x: (screenWidth / 2) + horizontalOffset,
      y: baseY + verticalOffset,
    };
  };

  const renderSteppingStone = (trailStep, stepIndex, trail, riverHeight) => {
    const position = getStepStonePosition(trailStep.stepNumber, trail.trailStepsCount, riverHeight);
    const isUnlocked = trailStep.isUnlocked;
    const hasExercises = trailStep.exercisesCount > 0;
    
    // Calculate completion status
    const completedExercises = trailStep.exercises?.filter(ex => ex.passed).length || 0;
    const totalExercises = trailStep.exercisesCount;
    const isCompleted = completedExercises === totalExercises && totalExercises > 0;
    const isPartiallyCompleted = completedExercises > 0 && completedExercises < totalExercises;

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
            left: position.x - 40, // Center the stone (80/2)
            top: position.y,
          },
          isUnlocked ? styles.stoneUnlocked : styles.stoneLocked,
          isCompleted && styles.stoneCompleted,
          isPartiallyCompleted && styles.stonePartial,
        ]}
        onPress={handleStepPress}
        disabled={!isUnlocked}
        activeOpacity={isUnlocked ? 0.7 : 1}
      >
        <View style={styles.stoneContent}>
          <Text style={[
            styles.stepNumber,
            isUnlocked ? styles.textUnlocked : styles.textLocked
          ]}>
            {trailStep.stepNumber}
          </Text>
          
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
        
        <View style={styles.stepLabel}>
          <Text style={[
            styles.stepName,
            isUnlocked ? styles.textUnlocked : styles.textLocked
          ]}>
            {trailStep.name}
          </Text>
          {totalExercises > 0 && (
            <Text style={[
              styles.exerciseCount,
              isUnlocked ? styles.textUnlockedSecondary : styles.textLockedSecondary
            ]}>
              {totalExercises} exercise{totalExercises !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        
        {/* Connection line to next stone */}
        {stepIndex < trail.trailStepsCount - 1 && (
          <View style={[
            styles.connectionLine,
            isUnlocked ? styles.lineUnlocked : styles.lineLocked
          ]} />
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

    // Calculate available height for river background
    // Account for: header (~100px), trail header (~120px), progress card (~180px), margins and padding
    const riverHeight = Math.max(screenHeight - 400, 300);

    return (
      <View key={trail.id} style={styles.trailContainer}>
        {/* Title and Description Card */}
        <View style={styles.trailHeader}>
          <Text style={styles.trailName}>{trail.name}</Text>
          <Text style={styles.categoryDescription}>
            {categoryData.description || 'Progress through each step to master this category'}
          </Text>
        </View>
        
        {/* Progress Information Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Progress Overview</Text>
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressNumber}>{trail.trailStepsCount}</Text>
              <Text style={styles.progressLabel}>Total Steps</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressNumber}>{completedSteps}</Text>
              <Text style={styles.progressLabel}>Completed</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressNumber}>{nextOpenStep ? nextOpenStep.stepNumber : '-'}</Text>
              <Text style={styles.progressLabel}>Next Step</Text>
            </View>
          </View>
          {nextOpenStep && (
            <Text style={styles.nextStepName}>
              Next: {nextOpenStep.name}
            </Text>
          )}
        </View>
        
        {/* River Background - fills remaining space */}
        <View style={[styles.riverBackground, { height: riverHeight }]}>
          {/* Water ripples effect */}
          <View style={[styles.ripple, styles.ripple1]} />
          <View style={[styles.ripple, styles.ripple2]} />
          <View style={[styles.ripple, styles.ripple3]} />
          
          {trail.trailSteps.map((trailStep, stepIndex) => 
            renderSteppingStone(trailStep, stepIndex, trail, riverHeight)
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
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categoryData.trails.map(renderTrail)}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
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
    paddingBottom: 50,
  },
  trailContainer: {
    flex: 1,
    margin: 20,
    marginTop: 10,
  },
  trailHeader: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 5,
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
  riverBackground: {
    flex: 1,
    backgroundColor: 'rgba(64, 164, 223, 0.3)',
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 400,
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  ripple1: {
    width: 100,
    height: 20,
    top: 50,
    left: 30,
  },
  ripple2: {
    width: 80,
    height: 15,
    top: 150,
    right: 40,
  },
  ripple3: {
    width: 120,
    height: 25,
    top: 280,
    left: 50,
  },
  steppingStone: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stoneLocked: {
    backgroundColor: '#cccccc',
    borderWidth: 2,
    borderColor: '#999999',
  },
  stoneUnlocked: {
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  stoneCompleted: {
    backgroundColor: '#2196F3',
    borderColor: '#1565C0',
  },
  stonePartial: {
    backgroundColor: '#FF9800',
    borderColor: '#E65100',
  },
  stoneContent: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  stepNumber: {
    fontSize: 24,
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
    top: 85,
    left: -30,
    right: -30,
    alignItems: 'center',
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