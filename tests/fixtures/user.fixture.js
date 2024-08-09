const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const prisma = require('../../prisma');
const { v4 } = require('uuid');

const password = 'password1#';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

const userOne = {
  id: v4(),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
};

const userTwo = {
  id: v4(),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'user',
};

const admin = {
  id: v4(),
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password,
  role: 'admin',
};

const insertUsers = async (users) => {
  users = users.map((user) => ({ ...user, password: hashedPassword }));
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
};

module.exports = {
  userOne,
  userTwo,
  admin,
  insertUsers,
};
