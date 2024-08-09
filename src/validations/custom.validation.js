const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi)) {
    return helpers.message('"{{#label}}" must be a valid UUID');
  }
  return value;
};

const password = (value, helpers) => {
  if (value.length < 8) {
    return helpers.message('password must be at least 8 characters');
  }
  if (!value.match(/\d/) || !value.match(/[a-zA-Z]/) || !value.match(/[!@#$%^&*(),.?":{}|<>]/)) {
    return helpers.message('password must contain at least 1 letter, 1 number and 1 special characters');
  }
  return value;
};

const phoneNumber = (value, helpers) => {
  if (!value.match(/^(?:\+62)[2-9]\d{8,11}$/)) {
    return helpers.message('number must be valid indonesia');
  }
  return value;
};

module.exports = {
  objectId,
  password,
  phoneNumber,
};
