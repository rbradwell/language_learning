// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/components/LoginScreen';
import RegisterScreen from './src/components/RegisterScreen';
import MainScreen from './src/components/MainScreen';

const Stack = createStackNavigator();

// App content that uses auth context
const AppContent = () => {
  const { isAuthenticated, loading, error, logout } = useAuth();

  // Show error alert if there's an authentication error
  React.useEffect(() => {
    if (error) {
      // Only show popup for actual login failures, not automatic token refresh failures
      if (!error.includes('Token refresh') && !error.includes('attempting refresh')) {
        Alert.alert(
          'Authentication Error',
          error,
          [
            {
              text: 'OK',
              onPress: () => {
                // If it's a session expired error, logout
                if (error.includes('Session expired') || error.includes('expired')) {
                  logout();
                }
              }
            }
          ]
        );
      }
    }
  }, [error, logout]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Main App component with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default App;