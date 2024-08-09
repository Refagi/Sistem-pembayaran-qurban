const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const prisma = require('../../prisma/index');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired, please refresh token'));
  }

  const userToken = await prisma.token.findFirst({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  if (!userToken || userToken.blacklisted === true) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'You have logged'));
  }

  req.user = user;

  resolve();
};

const auth = () => async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject))(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

const authAdmin = () => (req, res, next) => {
  return new Promise((succes, failed) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, succes, failed))(req, res, next);
  })
    .then(() => {
      if (req.user && req.user.role.toLowerCase() === 'admin') {
        return next();
      } else {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Only Admin to access');
      }
    })
    .catch((err) => next(err));
};

module.exports = { auth, authAdmin };
