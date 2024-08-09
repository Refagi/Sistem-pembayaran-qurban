const express = require('express');
const { authAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userController = require('../../controllers/user.controller');
const { userValidation } = require('../../validations');

const router = express.Router();

router.get('/add-user', (req, res) => {
  res.render('view-user/addUser.ejs', { title: 'Add User', errorMessage: null });
});

router
  .route('/')
  .post(authAdmin(), validate(userValidation.addUser), userController.addUser)
  .get(authAdmin(), userController.getUsers);

router.get('/edit/:userId', userController.updateUserView);

router
  .route('/:userId')
  .get(authAdmin(), validate(userValidation.getUsersById), userController.getUserById)
  .patch(authAdmin(), validate(userValidation.updateUserById), userController.updateUserById)
  .delete(authAdmin(), validate(userValidation.deleteUserById), userController.deleteUserById);

router.route('/email/:email').get(authAdmin(), validate(userValidation.getUserByEmail), userController.getUserByEmail);

module.exports = router;
