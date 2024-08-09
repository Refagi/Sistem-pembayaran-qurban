const express = require('express');
const { authAdmin, auth } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const animalController = require('../../controllers/animal.controller');
const { animalValidation } = require('../../validations');
const { paymentValidation } = require('../../validations');

const router = express.Router();

router.get('/add-animal', (req, res) => {
  res.render('animals/addAnimal.ejs', { title: 'Add-animal', errorMessage: null });
});

router
  .route('/')
  .post(authAdmin(), validate(animalValidation.createAnimal), animalController.createAnimal)
  .get(auth(), animalController.getAnimals);

router.route('/my-qurban/:userId').get(auth(), animalController.getMyAnimal);

router.route('/admin').get(authAdmin(), animalController.getAnimalsAdmin);

router.route('/select-animals/:animalId').post(auth(), animalController.selectAnimal);

router.route('/user/:animalId').get(auth(), validate(animalValidation.getAnimalById), animalController.getAnimalUser);

router.route('/edit/:animalId').get(authAdmin(), animalController.updateAnimalView);

router
  .route('/admin/:animalId')
  .patch(authAdmin(), validate(animalValidation.updateAnimalById), animalController.updateAnimalById)
  .get(authAdmin(), validate(animalValidation.getAnimalById), animalController.getAnimalById)
  .delete(authAdmin(), validate(animalValidation.deleteAnimalById), animalController.deleteAnimalById);

module.exports = router;
