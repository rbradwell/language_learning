// src/components/TrailProgressScreen.js
import React, { useState, useEffect } from 'react';
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
import AuthService from '../services/authService';

const { width: screenWidth } = Dimensions.get('window');

const TrailProgressScreen = ({ navigation }) => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchTrailProgress();
  }, []);

  const fetchTrailProgress = async () => {
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
        setProgressData(data.data);
        // Auto-select first category if available
        if (data.data.length > 0) {
          setSelectedCategory(data.data[0]);
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to load progress');
      }
    } catch (error) {
      console.error('Error fetching trail progress:', error);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const getStepStonePosition = (stepNumber, totalSteps) => {
    // Create natural stepping stone positions with varying alignment
    const baseSpacing = 80;
    const verticalVariation = 30;
    const horizontalVariation = 40;
    
    // Calculate base position
    const baseY = stepNumber * baseSpacing;
    
    // Add natural variation based on step number
    const horizontalOffset = (stepNumber % 3 === 0) ? -horizontalVariation : 
                           (stepNumber % 3 === 1) ? horizontalVariation : 0;
    
    const verticalOffset = Math.sin(stepNumber * 0.5) * verticalVariation;
    
    return {
      x: (screenWidth / 2) + horizontalOffset,
      y: baseY + verticalOffset,
    };
  };

  const renderSteppingStone = (trailStep, stepIndex, trail) => {
    const position = getStepStonePosition(trailStep.stepNumber, trail.trailStepsCount);
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

      // Navigate to exercises for this trail step
      navigation.navigate('TrailStepExercises', {
        trailStep: trailStep,
        trail: trail,
        category: selectedCategory
      });
    };

    return (
      <TouchableOpacity
        key={trailStep.id}
        style={[
          styles.steppingStone,
          {
            left: position.x - 35, // Center the stone (70/2)
            top: position.y,
          },
          isUnlocked ? styles.stoneUnlocked : styles.stoneLocked,
          isCompleted && styles.stoneCompleted,
          isPartiallyCompleted && styles.stonePartial,
        ]}
        onPress={handleStepPress}
        disabled={!isUnlocked}
      >
        <View style={styles.stoneContent}>
          <Text style={[
            styles.stepNumber,
            isUnlocked ? styles.textUnlocked : styles.textLocked
          ]}>
            {trailStep.stepNumber}
          </Text>
          
          {isCompleted && (
            <Text style={styles.checkmark}>✓</Text>
          )}
          
          {isPartiallyCompleted && (
            <Text style={styles.progress}>
              {completedExercises}/{totalExercises}
            </Text>
          )}
        </View>
        
        <Text style={[
          styles.stepName,
          isUnlocked ? styles.textUnlocked : styles.textLocked
        ]}>
          {trailStep.name}
        </Text>
        
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
      return null;
    }

    // Calculate total height needed for this trail
    const totalHeight = trail.trailStepsCount * 80 + 100;

    return (
      <View key={trail.id} style={[styles.trailContainer, { height: totalHeight }]}>
        <View style={styles.trailHeader}>
          <Text style={styles.trailName}>{trail.name}</Text>
          <Text style={styles.trailInfo}>
            {trail.trailStepsCount} steps • {trail.isUnlocked ? 'Unlocked' : 'Locked'}
          </Text>
        </View>
        
        <View style={styles.riverBackground}>
          {trail.trailSteps.map((trailStep, stepIndex) => 
            renderSteppingStone(trailStep, stepIndex, trail)
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  if (!progressData || progressData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No learning trails available</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchTrailProgress}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Category Selection */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {progressData.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory?.id === category.id && styles.categoryTabActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory?.id === category.id && styles.categoryTabTextActive
            ]}>
              {category.name}
            </Text>
            <Text style={styles.categoryDifficulty}>
              Level {category.difficulty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trail Display */}
      {selectedCategory && (
        <ScrollView 
          style={styles.trailScroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{selectedCategory.name}</Text>
            <Text style={styles.categoryDescription}>
              {selectedCategory.description}
            </Text>
          </View>

          {selectedCategory.trails?.map(renderTrail)}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f8ff', // Light blue background like water
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
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
    backgroundColor: '#f0f8ff',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryScroll: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  categoryTab: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 10,
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#007AFF',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  categoryTabTextActive: {
    color: 'white',
  },
  categoryDifficulty: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  trailScroll: {
    flex: 1,
  },
  categoryHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryDescription: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  trailContainer: {
    position: 'relative',
    marginVertical: 20,
  },
  trailHeader: {
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
  },
  trailName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  trailInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  riverBackground: {
    backgroundColor: 'rgba(173, 216, 230, 0.3)', // Light blue river
    borderRadius: 20,
    marginHorizontal: 10,
    position: 'relative',
    minHeight: 200,
  },
  steppingStone: {
    position: 'absolute',
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stoneUnlocked: {
    backgroundColor: '#4CAF50',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#388E3C',
  },
  stoneLocked: {
    backgroundColor: '#9E9E9E',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#757575',
  },
  stoneCompleted: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  stonePartial: {
    backgroundColor: '#FF9800',
    borderColor: '#F57C00',
  },
  stoneContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textUnlocked: {
    color: 'white',
  },
  textLocked: {
    color: '#424242',
  },
  checkmark: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    position: 'absolute',
    top: -5,
    right: -5,
  },
  progress: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    position: 'absolute',
    bottom: -5,
  },
  stepName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
    maxWidth: 80,
  },
  connectionLine: {
    position: 'absolute',
    width: 3,
    height: 40,
    top: 70,
    left: 33,
    transform: [{ rotate: '15deg' }],
  },
  lineUnlocked: {
    backgroundColor: '#4CAF50',
  },
  lineLocked: {
    backgroundColor: '#9E9E9E',
  },
  bottomPadding: {
    height: 50,
  },
});

export default TrailProgressScreen;