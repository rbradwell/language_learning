// src/screens/RegisterScreen.js - Enhanced with better error handling and feedback
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Snackbar,
  Menu,
  Divider,
  HelperText,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme/theme';

const RegisterScreen = ({ navigation, route }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    targetLanguage: '',
    nativeLanguage: 'English',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState('error');
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { register } = useAuth();

  const targetLanguages = ['Mandarin', 'Portuguese'];

  // Pre-fill email if passed from login screen
  useEffect(() => {
    if (route?.params?.prefillEmail) {
      handleInputChange('email', route.params.prefillEmail);
    }
  }, [route?.params?.prefillEmail]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleRegister = async () => {
    console.log('🔍 Register button pressed');
    console.log('📝 Form data:', {
      email: formData.email,
      username: formData.username,
      targetLanguage: formData.targetLanguage,
      passwordLength: formData.password.length
    });

    // Clear previous field errors
    setFieldErrors({});

    // Validation
    const { isValid, errors, fieldErrors: newFieldErrors } = validateForm();
    if (!isValid) {
      console.log('❌ Validation failed:', errors);
      setFieldErrors(newFieldErrors);
      showSnackbar(errors[0], 'error');
      return;
    }

    console.log('✅ Validation passed, starting registration...');
    setIsLoading(true);
    
    try {
      const registerData = {
        email: formData.email.trim(),
        password: formData.password,
        username: formData.username.trim(),
        targetLanguage: formData.targetLanguage,
        nativeLanguage: formData.nativeLanguage,
      };

      console.log('📤 Sending registration data:', {
        ...registerData,
        password: '[HIDDEN]'
      });

      const result = await register(registerData);
      
      console.log('📥 Registration result:', {
        success: result.success,
        message: result.message
      });
      
      if (!result.success) {
        const errorMessage = getErrorMessage(result.message || 'Registration failed');
        showSnackbar(errorMessage, 'error');
      } else {
        console.log('🎉 Registration successful!');
        showSnackbar('Account created successfully! Welcome!', 'success');
      }
      // If successful, navigation will happen automatically via AuthContext
    } catch (error) {
      console.error('💥 Registration error:', error);
      
      // Handle different types of errors
      if (error.message.includes('Network request failed')) {
        showSnackbar('Unable to connect to server. Please check your internet connection.', 'error');
      } else if (error.message.includes('timeout')) {
        showSnackbar('Request timed out. Please try again.', 'error');
      } else {
        showSnackbar('Something went wrong during registration. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    const fieldErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.push('Email is required');
      fieldErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.push('Please enter a valid email address');
      fieldErrors.email = 'Invalid email format';
    }

    // Username validation
    if (!formData.username.trim()) {
      errors.push('Username is required');
      fieldErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.push('Username must be at least 3 characters');
      fieldErrors.username = 'Minimum 3 characters required';
    } else if (formData.username.length > 20) {
      errors.push('Username must be less than 20 characters');
      fieldErrors.username = 'Maximum 20 characters allowed';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
      fieldErrors.username = 'Only letters, numbers, and _ allowed';
    }

    // Password validation
    if (!formData.password) {
      errors.push('Password is required');
      fieldErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
      fieldErrors.password = 'Minimum 6 characters required';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      fieldErrors.password = 'Need: uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.push('Please confirm your password');
      fieldErrors.confirmPassword = 'Password confirmation required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
      fieldErrors.confirmPassword = 'Passwords do not match';
    }

    // Target language validation
    if (!formData.targetLanguage) {
      errors.push('Please select a target language');
      fieldErrors.targetLanguage = 'Language selection required';
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  };

  const getErrorMessage = (backendMessage) => {
    const errorMessages = {
      'User with this email already exists': 'An account with this email already exists. Please try signing in instead.',
      'Username is already taken': 'This username is already taken. Please choose a different one.',
      'Validation failed': 'Please check your information and try again.',
      'Invalid email format': 'Please enter a valid email address.',
      'Password too weak': 'Password must contain at least one uppercase letter, lowercase letter, and number.',
    };

    return errorMessages[backendMessage] || backendMessage;
  };

  const showSnackbar = (message, type = 'error') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    setSnackbarVisible(true);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const getSnackbarStyle = () => {
    switch (snackbarType) {
      case 'success':
        return { backgroundColor: theme.colors.success || '#4CAF50' };
      case 'info':
        return { backgroundColor: theme.colors.info || '#2196F3' };
      case 'error':
      default:
        return { backgroundColor: theme.colors.error };
    }
  };

  // Debug: Log form state changes
  useEffect(() => {
    console.log('📝 Form state updated:', {
      hasEmail: !!formData.email,
      hasUsername: !!formData.username,
      hasPassword: !!formData.password,
      hasConfirmPassword: !!formData.confirmPassword,
      hasTargetLanguage: !!formData.targetLanguage
    });
  }, [formData]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Title style={styles.title}>Create Account</Title>
          <Paragraph style={styles.subtitle}>
            Join us and start learning a new language!
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Email"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              left={<TextInput.Icon icon="email" />}
              disabled={isLoading}
              error={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <HelperText type="error" style={styles.helperText}>
                {fieldErrors.email}
              </HelperText>
            )}

            <TextInput
              label="Username"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              disabled={isLoading}
              error={!!fieldErrors.username}
            />
            {fieldErrors.username && (
              <HelperText type="error" style={styles.helperText}>
                {fieldErrors.username}
              </HelperText>
            )}

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              disabled={isLoading}
              error={!!fieldErrors.password}
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {fieldErrors.password && (
              <HelperText type="error" style={styles.helperText}>
                {fieldErrors.password}
              </HelperText>
            )}

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              left={<TextInput.Icon icon="lock-check" />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              disabled={isLoading}
              error={!!fieldErrors.confirmPassword}
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {fieldErrors.confirmPassword && (
              <HelperText type="error" style={styles.helperText}>
                {fieldErrors.confirmPassword}
              </HelperText>
            )}

            <Menu
              visible={languageMenuVisible}
              onDismiss={() => setLanguageMenuVisible(false)}
              anchor={
                <TextInput
                  label="Target Language"
                  value={formData.targetLanguage}
                  mode="outlined"
                  style={styles.input}
                  left={<TextInput.Icon icon="translate" />}
                  right={<TextInput.Icon icon="chevron-down" />}
                  editable={false}
                  onPress={() => setLanguageMenuVisible(true)}
                  disabled={isLoading}
                  error={!!fieldErrors.targetLanguage}
                />
              }
            >
              {targetLanguages.map((language) => (
                <Menu.Item
                  key={language}
                  onPress={() => {
                    console.log('🌍 Language selected:', language);
                    handleInputChange('targetLanguage', language);
                    setLanguageMenuVisible(false);
                  }}
                  title={language}
                />
              ))}
            </Menu>
            {fieldErrors.targetLanguage && (
              <HelperText type="error" style={styles.helperText}>
                {fieldErrors.targetLanguage}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleRegister}
              style={styles.registerButton}
              disabled={isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <View style={styles.loginSection}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Button
                mode="text"
                onPress={() => navigation.navigate('Login')}
                disabled={isLoading}
                compact
              >
                Sign In
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={snackbarType === 'success' ? 3000 : 6000}
        style={[styles.snackbar, getSnackbarStyle()]}
        action={{
          label: snackbarMessage.includes('already exists') ? 'Sign In' : 'Dismiss',
          onPress: () => {
            if (snackbarMessage.includes('already exists')) {
              navigation.navigate('Login', { prefillEmail: formData.email });
            }
            setSnackbarVisible(false);
          },
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  input: {
    marginBottom: 4,
  },
  helperText: {
    marginBottom: 12,
    marginTop: -4,
  },
  registerButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: theme.colors.text,
    opacity: 0.7,
  },
  snackbar: {
    margin: 16,
    borderRadius: 8,
  },
});

export default RegisterScreen;