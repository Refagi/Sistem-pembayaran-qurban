const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const prisma = require('../../prisma/index');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// const generateShortToken = (tokens) => {
//   let result = '';
//   for (let i = 0; i < 8; i++) {
//     result += tokens.charAt(Math.floor(Math.random() * tokens.length));
//   }
//   return result;
// };

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await prisma.token.create({
    data: {
      token,
      userId: userId,
      expires: expires.toDate(),
      type,
      blacklisted,
    },
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await prisma.token.findFirst({
    where: { token, type, userId: payload.sub, blacklisted: false },
  });

  if (!tokenDoc) {
    throw new Error('Token tidak ditemukan!');
  }
  return tokenDoc;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, tokenTypes.ACCESS);
  // const shortTokens = generateShortToken(accessToken);

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, tokenTypes.REFRESH);
  // const shortRefreshToken = generateShortToken(refreshToken);
  await saveToken(refreshToken, user.id, refreshTokenExpires, tokenTypes.REFRESH);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

const refreshTokens = async (refresh) => {
  try {
    const payload = jwt.verify(refresh, config.jwt.secret);

    if (payload.type !== tokenTypes.REFRESH) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Tipe token tidak valid');
    }

    // if(payload.exp){
    //   throw new ApiError(httpStatus.UNAUTHORIZED, 'refresh token is expired')
    // }

    const findToken = await prisma.token.findFirst({
      where: { token: refresh, type: tokenTypes.REFRESH, blacklisted: false },
    });

    if (!findToken) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Tokne tidak ditemukan!');
    }

    const findUser = await prisma.user.findFirst({
      where: { id: payload.sub },
    });

    if (!findUser) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User tidak ditemukan!');
    }

    await prisma.token.delete({
      where: { id: findToken.id },
    });

    // res.cookie('access', '', { httpOnly: true, secure: true, expires: new Date(0) });
    // res.cookie('refresh', '', { httpOnly: true, secure: true, expires: new Date(0) });

    const refreshToken = await generateAuthTokens(findUser);
    return refreshToken;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token tidak valid atau refresh tokne tidak valid!');
    }
    throw error;
  }
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  refreshTokens,
  // generateShortToken
};
