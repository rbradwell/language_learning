// src/components/CategoryOverviewScreen.js
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
import { Svg, Circle, Path, Polygon, Rect } from 'react-native-svg';
import AuthService from '../services/authService';

const { width: screenWidth } = Dimensions.get('window');

// Simple SVG placeholder icon for categories
const CategoryIcon = ({ size = 80 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    {/* Book/Learning icon */}
    <Rect x="20" y="25" width="60" height="50" fill="#4CAF50" rx="4" />
    <Rect x="25" y="30" width="50" height="40" fill="white" rx="2" />
    <Path d="M30 40 L70 40 M30 50 L65 50 M30 60 L60 60" stroke="#4CAF50" strokeWidth="2" />
    <Circle cx="50" cy="15" r="8" fill="#2196F3" />
    <Path d="M46 12 L50 16 L54 12" stroke="white" strokeWidth="2" fill="none" />
  </Svg>
);

const CategoryOverviewScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategorySummary();
  }, []);

  const fetchCategorySummary = async () => {
    try {
      const token = await AuthService.getToken();
      const response = await fetch('http://192.168.0.27:8080/api/exercises/category-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      } else {
        Alert.alert('Error', data.message || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching category summary:', error);
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('TrailSteps', {
      category: category
    });
  };

  const renderCategoryCard = (category) => {
    const totalTrails = category.trailsCount || 0;
    const completedTrails = category.completedTrails || 0;
    const totalExercises = category.totalExercises || 0;
    const passedExercises = category.passedExercises || 0;
    const failedExercises = category.failedExercises || 0;
    
    const trailProgress = totalTrails > 0 ? (completedTrails / totalTrails) * 100 : 0;
    const exerciseProgress = totalExercises > 0 ? (passedExercises / totalExercises) * 100 : 0;

    return (
      <TouchableOpacity
        key={category.id}
        style={styles.categoryCard}
        onPress={() => handleCategoryPress(category)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <CategoryIcon size={60} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryLanguage}>{category.language}</Text>
            <Text style={styles.categoryDifficulty}>Level {category.difficulty}</Text>
          </View>
        </View>

        {category.description && (
          <Text style={styles.categoryDescription}>{category.description}</Text>
        )}

        <View style={styles.progressSection}>
          {/* Trail Progress */}
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Trails</Text>
              <Text style={styles.progressStats}>
                {completedTrails}/{totalTrails}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${trailProgress}%`, backgroundColor: '#4CAF50' }
                ]} 
              />
            </View>
          </View>

          {/* Exercise Progress */}
          <View style={styles.progressItem}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Exercises</Text>
              <Text style={styles.progressStats}>
                {passedExercises}/{totalExercises}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${exerciseProgress}%`, backgroundColor: '#2196F3' }
                ]} 
              />
            </View>
            
            {/* Exercise breakdown */}
            {totalExercises > 0 && (
              <View style={styles.exerciseBreakdown}>
                <View style={styles.exerciseBreakdownItem}>
                  <View style={[styles.exerciseIndicator, { backgroundColor: '#4CAF50' }]} />
                  <Text style={styles.exerciseBreakdownText}>
                    {passedExercises} passed
                  </Text>
                </View>
                <View style={styles.exerciseBreakdownItem}>
                  <View style={[styles.exerciseIndicator, { backgroundColor: '#F44336' }]} />
                  <Text style={styles.exerciseBreakdownText}>
                    {failedExercises} failed
                  </Text>
                </View>
                <View style={styles.exerciseBreakdownItem}>
                  <View style={[styles.exerciseIndicator, { backgroundColor: '#9E9E9E' }]} />
                  <Text style={styles.exerciseBreakdownText}>
                    {totalExercises - passedExercises - failedExercises} not attempted
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.tapHint}>Tap to explore trails</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your learning journey...</Text>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <CategoryIcon size={100} />
        <Text style={styles.emptyTitle}>No Learning Categories</Text>
        <Text style={styles.emptyText}>
          No categories are available for your target language yet.
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchCategorySummary}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learning Categories</Text>
        <Text style={styles.headerSubtitle}>
          Choose a category to start your learning journey
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map(renderCategoryCard)}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    marginRight: 15,
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  categoryLanguage: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  categoryDifficulty: {
    fontSize: 14,
    color: '#666',
  },
  categoryDescription: {
    fontSize: 15,
    color: '#555',
    lineHeight: 20,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 15,
  },
  progressItem: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressStats: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  exerciseBreakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  exerciseBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  exerciseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  exerciseBreakdownText: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  tapHint: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 20,
  },
});

export default CategoryOverviewScreen;