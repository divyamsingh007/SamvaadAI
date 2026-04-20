import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { redisClient } from '../config/redis.config.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Try Redis session cache first, but don't block auth if Redis is down
      let userSession = null;
      try {
        const redis = redisClient();
        userSession = await redis.get(String(decoded.id));
      } catch (redisError) {
        console.warn('⚠️ Redis session check failed, falling back to DB:', redisError.message);
      }

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token is invalid.',
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
      }

      if (req.user.isLocked()) {
        return res.status(401).json({
          success: false,
          message: 'Your account is locked due to multiple failed login attempts. Please try again later.',
        });
      }

      req.token = token;

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Token is invalid. Please login again.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication',
      error: error.message,
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      req.user = null;
    }

    next();
  } catch (error) {
    next();
  }
};

export const verifyRefreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      const tokenExists = user.refreshTokens.some(
        (t) => t.token === refreshToken
      );

      if (!tokenExists) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
        });
      }

      req.user = user;
      req.refreshToken = refreshToken;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Refresh token has expired. Please login again.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in refresh token verification',
      error: error.message,
    });
  }
};
