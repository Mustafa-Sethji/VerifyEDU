const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'verifyedu_secret_key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'verifyedu_refresh_secret_key';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// @desc    Register a new user (Teacher or Student)
// @route   POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, gradeLevel, bio } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const normalizedRole = role.toUpperCase();
    if (!['TEACHER', 'STUDENT'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Role must be either TEACHER or STUDENT.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: normalizedRole,
        teacherProfile: normalizedRole === 'TEACHER' ? {
          create: { department: department || 'General Education', bio: bio || '' }
        } : undefined,
        studentProfile: normalizedRole === 'STUDENT' ? {
          create: { gradeLevel: gradeLevel || 'High School', bio: bio || '' }
        } : undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
      },
    });

    // Record activity
    await prisma.history.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTERED',
        details: `Account created with role ${newUser.role}`,
      },
    });

    const tokens = generateTokens(newUser);

    return res.status(201).json({
      message: 'Account created successfully!',
      user: newUser,
      ...tokens,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration.', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Incorrect password.' });
    }

    const tokens = generateTokens(user);

    // Record activity
    await prisma.history.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: 'User logged in successfully',
      },
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      teacherProfile: user.teacherProfile,
      studentProfile: user.studentProfile,
    };

    return res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.', error: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: reqRefreshToken } = req.body;

    if (!reqRefreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const decoded = jwt.verify(reqRefreshToken, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    const tokens = generateTokens(user);
    return res.status(200).json(tokens);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

// @desc    Forgot Password - generate reset token
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Return success to avoid email enumeration
      return res.status(200).json({ message: 'If an account with that email exists, a password reset code has been generated.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    return res.status(200).json({
      message: 'Password reset token generated successfully.',
      resetToken, // Returned for testing / prompt workflow ease
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error processing forgot password.', error: error.message });
  }
};

// @desc    Reset Password with token
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error resetting password.', error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        createdAt: true,
        teacherProfile: true,
        studentProfile: true,
      },
    });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching profile.', error: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
};
