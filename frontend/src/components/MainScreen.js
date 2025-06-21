// src/components/MainScreen.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import CategoryOverviewScreen from './CategoryOverviewScreen';  // New primary screen
import TrailStepsScreen from './TrailStepsScreen';              // New stepping stones screen
import TrailProgressScreen from './TrailProgressScreen';        // Keep as legacy/backup
import AuthService from '../services/authService';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

const Stack = createStackNavigator();

// Simple header component with logout
const AppHeader = ({ title, onLogout }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
      <Text style={styles.logoutButtonText}>Logout</Text>
    </TouchableOpacity>
  </View>
);

// Placeholder for TrailStepExercises screen (you can expand this later)
const TrailStepExercisesScreen = ({ route, navigation }) => {
  const { trailStep, trail, category } = route.params;
  
  return (
    <View style={styles.exerciseContainer}>
      <Text style={styles.exerciseTitle}>
        {trailStep.name}
      </Text>
      <Text style={styles.exerciseInfo}>
        Trail: {trail.name} • Category: {category.name}
      </Text>
      <Text style={styles.exerciseDetails}>
        {trailStep.exercisesCount} exercises • Passing score: {trailStep.passingScore}%
      </Text>
      <Text style={styles.exerciseNote}>
        This is where you'll implement the actual exercises.
      </Text>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Trail Steps</Text>
      </TouchableOpacity>
    </View>
  );
};

const MainScreen = ({ navigation, onLogout }) => {
  const handleLogout = async () => {
    try {
      await AuthService.logout();
      Alert.alert('Success', 'Logged out successfully', [
        { text: 'OK', onPress: () => onLogout() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  return (
    <Stack.Navigator>
      {/* Primary screen: Category Overview */}
      <Stack.Screen 
        name="CategoryOverview" 
        component={CategoryOverviewScreen}
        options={{
          header: () => <AppHeader title="Learning Categories" onLogout={handleLogout} />
        }}
      />
      
      {/* Trail Steps screen with stepping stones */}
      <Stack.Screen 
        name="TrailSteps" 
        component={TrailStepsScreen}
        options={{
          headerTitle: "Trail Steps",
          headerBackTitle: "Categories",
          headerStyle: { 
            backgroundColor: '#007AFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          headerTintColor: 'white',
          headerTitleStyle: { 
            fontWeight: 'bold',
            fontSize: 18 
          },
          headerBackTitleVisible: false,
        }}
      />
      
      {/* Individual trail step exercises */}
      <Stack.Screen 
        name="TrailStepExercises" 
        component={TrailStepExercisesScreen}
        options={({ route }) => ({
          title: route.params?.trailStep?.name || 'Exercises',
          headerBackTitle: "Back",
          headerStyle: { 
            backgroundColor: '#007AFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
          headerTintColor: 'white',
          headerTitleStyle: { 
            fontWeight: 'bold',
            fontSize: 18 
          },
          headerBackTitleVisible: false,
        })}
      />
      
      {/* Legacy screen - keep for reference/backup */}
      <Stack.Screen 
        name="TrailProgress" 
        component={TrailProgressScreen}
        options={{
          header: () => <AppHeader title="Trail Progress (Legacy)" onLogout={handleLogout} />
        }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 30,
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  exerciseInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  exerciseNote: {
    fontSize: 16,
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 40,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainScreen;