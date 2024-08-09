const Joi = require('joi');
const { password } = require('./custom.validation');
const { join } = require('@prisma/client/runtime/library');

const register = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ minDomainSegments: 2, tlds: { allow: ['com'] } }),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required(),
    age: Joi.number().integer().required(),
    adress: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string()
      .required()
      .email({ minDomainSegments: 2, tlds: { allow: ['com'] } }),
    password: Joi.string().required(),
  }),
};

// const logout = {
//   body: Joi.object().keys({
//     email: Joi.string()
//       .required()
//       .email({ minDomainSegments: 2, tlds: { allow: ['com'] } }),
//   }),
// };

// const refreshToken = {
//   body: Joi.object().keys({
//     refresh: Joi.string().required(),
//   }),
// };

module.exports = {
  register,
  login,
  // logout,
  // refreshToken,
};
