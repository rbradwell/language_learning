// src/utils/validation.js
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };
  
  export const validateUsername = (username) => {
    const errors = [];
    
    if (username.length < 3 || username.length > 20) {
      errors.push('Username must be between 3 and 20 characters');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }
    
    return errors;
  };
  
  export const validateLoginForm = (email, password) => {
    const errors = [];
    
    if (!email) {
      errors.push('Email is required');
    } else if (!validateEmail(email)) {
      errors.push('Please provide a valid email');
    }
    
    if (!password) {
      errors.push('Password is required');
    }
    
    return errors;
  };
  
  export const validateRegisterForm = (formData) => {
    const errors = [];
    
    // Email validation
    if (!formData.email) {
      errors.push('Email is required');
    } else if (!validateEmail(formData.email)) {
      errors.push('Please provide a valid email');
    }
    
    // Username validation
    if (!formData.username) {
      errors.push('Username is required');
    } else {
      errors.push(...validateUsername(formData.username));
    }
    
    // Password validation
    if (!formData.password) {
      errors.push('Password is required');
    } else {
      errors.push(...validatePassword(formData.password));
    }
    
    // Target language validation
    if (!['Mandarin', 'Portuguese'].includes(formData.targetLanguage)) {
      errors.push('Target language must be either Mandarin or Portuguese');
    }
    
    return errors;
  };