const express = require('express');
const authController = require('../../controllers/auth.controller');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const { auth } = require('../../middlewares/auth');

const router = express.Router();

router.post('/login', validate(authValidation.login), authController.login);
router.get('/login', (req, res) => {
  res.render('login', { errorMessage: null });
});

router.post('/register', validate(authValidation.register), authController.register);
router.get('/register', (req, res) => {
  res.render('register', { errorMessage: null });
});

router.post('/logout', auth(), authController.logout);
router.get('/logout', (req, res) => {
  res.render('logout', { errorMessage: null });
});

router.post('/refresh', authController.refreshTokens);
router.get('/refresh', (req, res) => {
  res.render('refreshToken', { errorMessage: null });
});

module.exports = router;
