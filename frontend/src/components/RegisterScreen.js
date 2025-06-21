// src/components/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AuthService from '../services/authService';
import { validateRegisterForm } from '../utils/validation';

const RegisterScreen = ({ navigation, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    targetLanguage: 'Mandarin',
    nativeLanguage: 'English',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleRegister = async () => {
    // Clear previous messages
    setErrorMessage('');
    setSuccessMessage('');
    
    const errors = validateRegisterForm(formData);
    
    if (errors.length > 0) {
      setErrorMessage(errors.join('. '));
      return;
    }

    setLoading(true);
    try {
      const result = await AuthService.register(formData);
      
      if (result.success) {
        setSuccessMessage('Account created successfully! Welcome to the app.');
        setTimeout(() => {
          onAuthSuccess();
        }, 1000);
      } else {
        // Handle different error messages
        if (result.message === 'User with this email already exists') {
          setErrorMessage('An account with this email already exists. Please try logging in instead or use a different email.');
        } else if (result.message === 'Username is already taken') {
          setErrorMessage('This username is already taken. Please choose a different username.');
        } else {
          setErrorMessage(result.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      setErrorMessage('Unable to connect to the server. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>

          {errorMessage ? (
            <View style={styles.messageContainer}>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.messageContainer}>
              <Text style={styles.successMessage}>{successMessage}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Username"
            value={formData.username}
            onChangeText={(text) => handleInputChange('username', text)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Target Language:</Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  formData.targetLanguage === 'Mandarin' && styles.selectedLanguage
                ]}
                onPress={() => handleInputChange('targetLanguage', 'Mandarin')}
              >
                <Text style={[
                  styles.languageButtonText,
                  formData.targetLanguage === 'Mandarin' && styles.selectedLanguageText
                ]}>
                  Mandarin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  formData.targetLanguage === 'Portuguese' && styles.selectedLanguage
                ]}
                onPress={() => handleInputChange('targetLanguage', 'Portuguese')}
              >
                <Text style={[
                  styles.languageButtonText,
                  formData.targetLanguage === 'Portuguese' && styles.selectedLanguageText
                ]}>
                  Portuguese
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Native Language (optional)"
            value={formData.nativeLanguage}
            onChangeText={(text) => handleInputChange('nativeLanguage', text)}
            autoCapitalize="words"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Register'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.toggleButtonText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 20,
    padding: 10,
  },
  toggleButtonText: {
    color: '#007AFF',
    textAlign: 'center',
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: '#fafafa',
  },
  selectedLanguage: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  languageButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  selectedLanguageText: {
    color: 'white',
    fontWeight: '600',
  },
  messageContainer: {
    marginBottom: 15,
    padding: 12,
    borderRadius: 8,
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successMessage: {
    color: '#34C759',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default RegisterScreen;