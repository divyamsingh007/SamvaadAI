
import { redisClient } from '../config/redis.config.js';

const accessTokenExpires = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || '15',
  10
);
const refreshTokenExpires = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || '7',
  10
);

export const accessTokenOptions = {
  expires: new Date(Date.now() + accessTokenExpires * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
};

export const refreshTokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
};

export const sendToken = async (user, statusCode, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Cache user session in Redis (non-blocking — auth still works via JWT if Redis is down)
  try {
    const redis = redisClient();
    await redis.set(String(user._id), {
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
    console.warn('⚠️ Redis cache write failed (auth will still work via JWT):', redisError.message);
  }

  if (process.env.NODE_ENV === 'production') {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
  }

  res.cookie('accessToken', accessToken, accessTokenOptions);
  res.cookie('refreshToken', refreshToken, refreshTokenOptions);

  res.status(statusCode).json({
    success: true,
    message: statusCode === 201 ? 'User registered successfully' : 'Login successful',
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    },
    accessToken,
  });
};
