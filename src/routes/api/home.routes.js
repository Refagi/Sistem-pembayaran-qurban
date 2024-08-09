const express = require('express');
const authController = require('../../controllers/auth.controller');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const { authAdmin, auth } = require('../../middlewares/auth');
const prisma = require('../../../prisma');
const { userService, tokenService } = require('../../services');
const userController = require('../../controllers/user.controller');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status');

const router = express.Router();

router.get('/', async (req, res) => {
  const getTokenCookies = req.cookies.access;
  // const users = await userService.geUsers();
  const users = await prisma.user.findMany();

  if (!users || users.length === 0) {
    return res.render('index', { title: 'System Pembayaran Qurban', user: null, errorMessage: null });
  }

  const getToken = await prisma.token.findFirst({
    where: { userId: users.id },
    orderBy: { createdAt: 'desc' },
  });

  let user;
  if (getToken) {
    if (getToken.blacklisted === true && !getTokenCookies) {
      user = null;
    } else {
      user = await prisma.user.findFirst({
        where: { id: getToken.userId },
      });
    }
  }

  res.status(httpStatus.OK).render('index', { title: 'System Pembayaran Qurban', user: user || null, errorMessage: null });
});

module.exports = router;
