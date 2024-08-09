const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createAnimal = {
  body: Joi.object().keys({
    type: Joi.string().valid('sapi', 'kambing', 'domba').required().insensitive(),
    price: Joi.number().positive().required(),
    status: Joi.string().required().valid('available', 'sold').insensitive(),
    weight: Joi.number().positive().required(),
    gender: Joi.string().valid('male', 'female').required().insensitive(),
    age: Joi.number().positive().required(),
  }),
};

const selectAnimal = {
  body: Joi.object().keys({
    user_id: Joi.string().custom(objectId).required(),
    animal_id: Joi.string().custom(objectId).required(),
    name: Joi.string().required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com'] } })
      .required(),
  }),
};

const getAnimalById = {
  params: Joi.object().keys({
    animalId: Joi.string().custom(objectId).required(),
  }),
};

const updateAnimalById = {
  params: Joi.object().keys({
    animalId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      type: Joi.string().valid('sapi', 'kambing', 'domba').insensitive(),
      price: Joi.number().positive(),
      status: Joi.string().valid('available', 'sold').insensitive(),
      weight: Joi.number().positive(),
      gender: Joi.string().valid('male', 'female').insensitive(),
      age: Joi.number().positive(),
    })
    .min(1),
};

const deleteAnimalById = {
  params: Joi.object().keys({
    animalId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createAnimal,
  selectAnimal,
  getAnimalById,
  updateAnimalById,
  deleteAnimalById,
};
