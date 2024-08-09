const moment = require('moment');
const config = require('../../src/config/config');
const { tokenTypes } = require('../../src/config/tokens');
const tokenService = require('../../src/services/token.service');
const { userOne, admin, userTwo } = require('./user.fixture');
const prisma = require('../../prisma');

const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
const userOneAccessToken = tokenService.generateToken(userOne.id, accessTokenExpires, tokenTypes.ACCESS);
const adminAccessToken = tokenService.generateToken(admin.id, accessTokenExpires, tokenTypes.ACCESS);

const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
const userOneRefreshToken = tokenService.generateToken(userOne.id, refreshTokenExpires, tokenTypes.REFRESH);
const userTwoRefreshToken = tokenService.generateToken(userTwo.id, refreshTokenExpires, tokenTypes.REFRESH);

const refreshOne = {
  token: userOneRefreshToken,
  userId: userOne.id,
  expires: refreshTokenExpires.toDate(),
  type: tokenTypes.REFRESH,
  blacklisted: false,
};

const insertRefreshToken = async (refreshTokens) => {
  try {
    const result = await prisma.token.createMany({
      data: refreshTokens,
      skipDuplicates: true,
    });

    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  userOneAccessToken,
  adminAccessToken,
  userOneRefreshToken,
  refreshOne,
  insertRefreshToken,
  userTwoRefreshToken,
};
