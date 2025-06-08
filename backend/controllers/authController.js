// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const { Op } = require('sequelize');

// Debug: Log environment variables
console.log('=== ENVIRONMENT VARIABLES DEBUG ===');
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
console.log('JWT_REFRESH_SECRET length:', process.env.JWT_REFRESH_SECRET ? process.env.JWT_REFRESH_SECRET.length : 0);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=====================================');

// Helper function to generate tokens
const generateTokens = (user) => {
  console.log('🔧 Generating tokens for user:', user.id);
  
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email 
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id }, 
    process.env.JWT_REFRESH_SECRET, 
    { expiresIn: '7d' }
  );
  
  console.log('✅ Tokens generated successfully');
  return { accessToken, refreshToken };
};

// Helper function to exclude password from user object
const excludePassword = (user) => {
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

const register = async (req, res) => {
  console.log('🔍 Registration attempt started for:', req.body.email);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Registration validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password, username, targetLanguage, nativeLanguage } = req.body;
    console.log('🔍 Checking if user exists...');

    // Check if user exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
      } 
    });

    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({ 
        success: false,
        message: existingUser.email === email 
          ? 'User with this email already exists' 
          : 'Username is already taken'
      });
    }

    console.log('🔍 Hashing password...');
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log('🔍 Creating user in database...');
    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
      targetLanguage,
      nativeLanguage: nativeLanguage || 'English'
    });

    console.log('✅ User created successfully, generating tokens...');
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    console.log('🔍 Setting cookie and sending response...');
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: accessToken,
      user: excludePassword(user)
    });
    
    console.log('✅ Registration response sent successfully');
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const login = async (req, res) => {
  console.log('🔍 Login attempt started for:', req.body.email);
  
  try {
    console.log('🔍 Validating request...');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Login validation errors:', errors.array());
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    console.log('🔍 Searching for user with email:', email);

    // Find user and include password for comparison
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ User found:', user.id);
    console.log('🔍 Comparing passwords...');

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Password valid, generating tokens...');

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    console.log('🔍 Setting cookie...');
    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('🔍 Sending response...');
    res.json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      user: excludePassword(user)
    });
    
    console.log('✅ Login response sent successfully');
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: excludePassword(user)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false,
        message: 'Refresh token not provided' 
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Check if user still exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: accessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      success: false,
      message: 'Invalid or expired refresh token' 
    });
  }
};

const logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during logout' 
    });
  }
};

module.exports = { 
  register, 
  login, 
  getProfile, 
  refreshToken, 
  logout 
};