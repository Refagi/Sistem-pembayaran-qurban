const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { animalService } = require('../services');

const createAnimal = catchAsync(async (req, res) => {
  await animalService.createAnimal(req.body);

  res.status(httpStatus.CREATED).redirect('/api/animals/admin');
});

const selectAnimal = catchAsync(async (req, res) => {
  const animalId = req.params.animalId;
  const userId = req.user.id;
  await animalService.selectAnimal({ animal_id: animalId, user_id: userId });

  res.status(httpStatus.CREATED).redirect('/api/animals');
});

const getAnimalById = catchAsync(async (req, res) => {
  const animal = await animalService.getAnimalById(req.params.animalId);

  if (!animal) throw new ApiError(httpStatus.NOT_FOUND, 'Animal not found');

  res.status(httpStatus.OK).render('animals/getAnimalAdmin.ejs', {
    title: 'Detail-animal',
    errorMessage: null,
    animals: animal,
  });
});

const getAnimalUser = catchAsync(async (req, res) => {
  const animal = await animalService.getAnimalById(req.params.animalId);

  if (!animal) throw new ApiError(httpStatus.NOT_FOUND, 'Animal not found');

  res.status(httpStatus.OK).render('animals/selectAnimal.ejs', {
    title: 'Select-animal',
    errorMessage: null,
    animals: animal,
  });
});

const getMyAnimal = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const getAnimals = await animalService.getMyAnimal(userId);

  res.status(httpStatus.OK).render('animals/myAnimal.ejs', {
    title: 'my-animal',
    errorMessage: null,
    animal: getAnimals.getAnimal,
    user: getAnimals.getUser,
  });
});

const getAnimalsAdmin = catchAsync(async (req, res) => {
  const options = {
    page: parseInt(req.query.page, 10) || 1, // Default page adalah 1
    size: parseInt(req.query.size, 10) || 5, // Default size adalah 5
    search: req.query.search || '',
  };

  const animals = await animalService.getAnimalsAdmin(options);

  res.status(httpStatus.OK).render('animals/animalAdmin.ejs', {
    title: 'Animals-admin',
    errorMessage: null,
    animals: animals.animals,
    currentPage: animals.page,
    totalData: animals.totalData,
    totalPage: animals.totalPage,
    pageSize: animals.size,
    iteration: animals.iteration,
    endFor: animals.endFor,
    search: options.search,
  });
});

const getAnimals = catchAsync(async (req, res) => {
  const filter = { search: req.query.search || '' };
  const getUser = req.user;

  const animals = await animalService.getAnimals(filter);

  res.status(httpStatus.OK).render('animals/animalUser.ejs', {
    title: 'Animals',
    animals: animals.animals,
    search: animals.search,
    user: getUser,
  });
});

const updateAnimalView = catchAsync(async (req, res) => {
  const animal = await animalService.getAnimalById(req.params.animalId);
  res.render('animals/editAnimal.ejs', { title: 'Edit-animal', animal, errorMessage: null });
});

const updateAnimalById = catchAsync(async (req, res) => {
  await animalService.updateAnimalById(req.params.animalId, req.body);

  res.status(httpStatus.OK).redirect('/api/animals/admin');
});

const deleteAnimalById = catchAsync(async (req, res) => {
  await animalService.deleteAnimalById(req.params.animalId);

  res.status(httpStatus.OK).redirect('/api/animals/admin');
});

module.exports = {
  createAnimal,
  selectAnimal,
  getAnimalById,
  getMyAnimal,
  getAnimalsAdmin,
  getAnimalUser,
  getAnimals,
  updateAnimalView,
  updateAnimalById,
  deleteAnimalById,
};
