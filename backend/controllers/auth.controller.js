import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis.config.js';
import { sendToken } from '../utils/jwt.util.js';

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password',
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken',
      });
    }

    const user = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    await sendToken(user, 201, res);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if ((!email && !username) || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/username and password',
      });
    }

    const user = await User.findOne({
      $or: [{ email }, { username }],
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.isLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked due to multiple failed login attempts. Please try again later.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.',
      });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      await user.incLoginAttempts();

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    await user.resetLoginAttempts();

    user.lastLogin = Date.now();

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshTokens.push({ token: refreshToken });
    
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    await sendToken(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (req.user) {
      try {
        const redis = redisClient();
        await redis.del(String(req.user.id));
      } catch (redisError) {
        console.warn('⚠️ Redis logout cleanup failed:', redisError.message);
      }
      
      if (refreshToken) {
        await User.findByIdAndUpdate(req.user.id, {
          $pull: { refreshTokens: { token: refreshToken } },
        });
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message,
    });
  }
};

export const logoutAll = async (req, res) => {
  try {
    if (req.user) {
      try {
        const redis = redisClient();
        await redis.del(String(req.user.id));
      } catch (redisError) {
        console.warn('⚠️ Redis logoutAll cleanup failed:', redisError.message);
      }

      await User.findByIdAndUpdate(req.user.id, {
        $set: { refreshTokens: [] },
      });
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out from all devices',
      error: error.message,
    });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    let redisAvailable = true;
    let user = null;
    try {
      const redis = redisClient();
      user = await redis.get(String(decoded.id));
    } catch (redisError) {
      console.warn('⚠️ Redis refresh check failed:', redisError.message);
      redisAvailable = false;
    }
    
    // Only reject for missing session if Redis is actually reachable
    if (redisAvailable && !user) {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.',
      });
    }

    const dbUser = await User.findById(decoded.id);

    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const tokenExists = dbUser.refreshTokens.some(
      (t) => t.token === refreshToken
    );

    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }

    const newAccessToken = dbUser.generateAccessToken();

    const newRefreshToken = dbUser.generateRefreshToken();


    dbUser.refreshTokens = dbUser.refreshTokens.filter(
      (t) => t.token !== refreshToken
    );
    dbUser.refreshTokens.push({ token: newRefreshToken });
    await dbUser.save();

    try {
      const redisForRefresh = redisClient();
      await redisForRefresh.set(String(dbUser._id), {
        _id: dbUser._id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        isActive: dbUser.isActive,
        isEmailVerified: dbUser.isEmailVerified,
        lastLogin: dbUser.lastLogin,
      }, {
        ex: 7 * 24 * 60 * 60,
      });
    } catch (redisError) {
      console.warn('⚠️ Redis refresh cache write failed:', redisError.message);
    }

    setCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.',
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message,
    });
  }
};

export const getMe = async (req, res) => {
  try {
    let cachedUser = null;
    try {
      const redis = redisClient();
      cachedUser = await redis.get(String(req.user.id));
    } catch (redisError) {
      console.warn('⚠️ Redis getMe cache read failed:', redisError.message);
    }

    if (cachedUser) {
      return res.status(200).json({
        success: true,
        data: { user: cachedUser },
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    try {
      const redis = redisClient();
      await redis.set(String(req.user.id), userData, {
        ex: 7 * 24 * 60 * 60,
      });
    } catch (redisError) {
      console.warn('⚠️ Redis getMe cache write failed:', redisError.message);
    }

    res.status(200).json({
      success: true,
      data: { user: userData },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, email } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }
      user.email = email;
      user.isEmailVerified = false;
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    try {
      const redis = redisClient();
      await redis.set(String(req.user.id), {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
      }, {
        ex: 7 * 24 * 60 * 60,
      });
    } catch (redisError) {
      console.warn('⚠️ Redis profile update cache failed:', redisError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password',
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    
    user.refreshTokens = [];
    
    await user.save();

    try {
      const redis = redisClient();
      await redis.del(String(user._id));
    } catch (redisError) {
      console.warn('⚠️ Redis password change cleanup failed:', redisError.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      data: {
        resetToken,
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshTokens = [];
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    const user = await User.findOne({
      _id: decoded.id,
      emailVerificationToken: token,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message,
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Verification email sent',
      data: {
        verificationToken,
      },
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: error.message,
    });
  }
};
