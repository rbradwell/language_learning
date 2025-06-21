// src/components/MainScreen.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TrailProgressScreen from './TrailProgressScreen';
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

// Placeholder for TrailStepExercises screen
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
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Trail</Text>
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
      <Stack.Screen 
        name="TrailProgress" 
        component={TrailProgressScreen}
        options={{
          header: () => <AppHeader title="Learning Trails" onLogout={handleLogout} />
        }}
      />
      <Stack.Screen 
        name="TrailStepExercises" 
        component={TrailStepExercisesScreen}
        options={{
          headerTitle: "Exercises",
          headerBackTitle: "Back"
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
    borderRadius: 6,
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  exerciseInfo: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainScreen;
