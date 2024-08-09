const Joi = require('joi');
const { objectId, phoneNumber } = require('./custom.validation');

const createPayment = {
  body: Joi.object().keys({
    animal_id: Joi.string().custom(objectId).required(),
    notes_id: Joi.string().custom(objectId).required(),
    amount: Joi.number().positive().required(),
    status_animal: Joi.string().valid('available', 'sold').required(),
    name: Joi.string().required(),
    handphone: Joi.string().custom(phoneNumber).required(),
    information: Joi.string().required(),
  }),
};

const getPaymentById = {
  params: Joi.object().keys({
    paymentId: Joi.string().custom(objectId).required(),
  }),
};

const updatePaymentById = {
  params: Joi.object().keys({
    paymentId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status_animal: Joi.string().valid('available', 'sold').required(),
    name: Joi.string().required(),
    handphone: Joi.custom(phoneNumber).required(),
    information: Joi.string().required(),
  }),
};

const deletePaymentById = {
  params: Joi.object().keys({
    paymentId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createPayment,
  getPaymentById,
  updatePaymentById,
  deletePaymentById,
};
