const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createNotes = {
  body: Joi.object().keys({
    user_id: Joi.string().custom(objectId).required(),
    animal_id: Joi.string().custom(objectId).required(),
    payment_amount: Joi.number().positive(),
    name: Joi.string().required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com'] } })
      .required(),
  }),
};

const getNotesById = {
  params: Joi.object().keys({
    notesId: Joi.string().custom(objectId).required(),
  }),
};

const updateNotesById = {
  params: Joi.object().keys({
    notesId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    user_id: Joi.string().custom(objectId).required(),
    animal_id: Joi.string().custom(objectId).required(),
    payment_amount: Joi.number().positive(),
    name: Joi.string().required(),
    email: Joi.string()
      .email({ minDomainSegments: 2, tlds: { allow: ['com'] } })
      .required(),
  }),
};

const deleteNotesById = {
  params: Joi.object().keys({
    notesId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createNotes,
  getNotesById,
  updateNotesById,
  deleteNotesById,
};
