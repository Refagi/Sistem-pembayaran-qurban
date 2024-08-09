const express = require('express');
const authRoute = require('./auth.routes');
const userRoute = require('./user.routes');
const animalRoute = require('./animal.routes');
const paymentRoute = require('./payment.routes');
const notesRoute = require('./notes.routes');
const homeRoute = require('./home.routes');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/',
    route: homeRoute,
  },
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/animals',
    route: animalRoute,
  },
  {
    path: '/payments',
    route: paymentRoute,
  },
  {
    path: '/notes',
    route: notesRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
