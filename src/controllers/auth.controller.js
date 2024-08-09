const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, animalService, paymentService, notesService } = require('../services');
const ApiError = require('../utils/ApiError');
const prisma = require('../../prisma/index');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const register = catchAsync(async (req, res) => {
  const existingUser = await userService.getUserByEmail(req.body.email);

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email sudah terdaftar!');
  }

  await userService.createUser(req.body);
  let message = (req.session.message = {
    type: 'success',
    message: 'Berhasil Daftar!',
  });
  res.status(httpStatus.CREATED).render('login', { errorMessage: null, message });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const existingUser = await userService.getUserByEmail(req.body.email);
  if (!existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Anda belum punya akun, silahkan daftar!');
  }

  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const existingLoginUser = await prisma.token.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const getCookies = req.cookies.access;
  let tokens;

  if (existingLoginUser) {
    if (existingLoginUser.blacklisted === false && getCookies) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Anda sudah masuk!');
    } else {
      await prisma.token.delete({
        where: { id: existingLoginUser.id },
      });
      tokens = await tokenService.generateAuthTokens(user);
      res.cookie('access', tokens.access.token, {
        httpOnly: true,
        secure: config.env === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
      res.cookie('refresh', tokens.refresh.token, {
        httpOnly: true,
        secure: config.env === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });
    }
  } else if (existingLoginUser && !getCookies) {
    tokens = await tokenService.generateAuthTokens(user);
    res.cookie('access', tokens.access.token, {
      httpOnly: true,
      secure: config.env === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    res.cookie('refresh', tokens.refresh.token, {
      httpOnly: true,
      secure: config.env === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  } else {
    tokens = await tokenService.generateAuthTokens(user);
    res.cookie('access', tokens.access.token, {
      httpOnly: true,
      secure: config.env === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
    res.cookie('refresh', tokens.refresh.token, {
      httpOnly: true,
      secure: config.env === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  let message = (req.session.message = {
    type: 'success',
    message: 'Berhasil Masuk!',
    refresh: tokens.refresh.token,
  });
  res
    .status(httpStatus.OK)
    .render('index', { title: 'Home', message: message || null, errorMessage: null, user: user || [] });
});

const logout = catchAsync(async (req, res) => {
  const accessToken = req.cookies.access;

  let userId;
  if (accessToken) {
    jwt.verify(accessToken, config.jwt.secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          throw new ApiError(httpStatus.UNAUTHORIZED, 'Token kadaluarsa, silahkan refresh token');
        }
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Token tidak valid');
      }
      userId = decoded.id;
    });
  }

  const getToken = await prisma.token.findFirst({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' },
  });

  if (getToken) {
    await prisma.token.update({
      where: { id: getToken.id },
      data: { blacklisted: true },
    });
  }

  res.cookie('access', '', { httpOnly: true, secure: config.env === 'production', expires: new Date(0) });
  res.cookie('refresh', '', { httpOnly: true, secure: config.env === 'production', expires: new Date(0) });
  res.redirect('/');
});

const refreshTokens = catchAsync(async (req, res) => {
  const refreshToken = req.cookies.refresh;

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Anda tidak punya refresh token, silahkan masuk!');
  }

  const newToken = await tokenService.refreshTokens(refreshToken);

  res.cookie('access', newToken.access.token, { httpOnly: true, secure: true });
  res.cookie('refresh', newToken.refresh.token, { httpOnly: true, secure: true });

  res.status(httpStatus.OK).redirect('/');
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
};
