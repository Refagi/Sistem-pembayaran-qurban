const httpStatus = require('http-status');
const prisma = require('../../prisma/index');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const tokenService = require('./token.service');
const { faker } = require('@faker-js/faker');

const createUser = async (userBody) => {
  userBody.password = bcrypt.hashSync(userBody.password, 8);

  return prisma.user.create({
    data: userBody,
  });
};

const addUser = async (userBody) => {
  userBody.password = bcrypt.hashSync(userBody.password, 8);

  const user = await prisma.user.create({
    data: userBody,
  });

  // const user = await prisma.user.create({
  //   data: {
  //     name: faker.person.fullName(),
  //     email: faker.internet.email().toLowerCase(),
  //     password:  faker.internet.password(),
  //     role: 'user',
  //     age: faker.number.int({ min: 17, max: 60 }),
  //     adress: faker.location.city()
  //   },
  // });

  if (user) {
    await tokenService.generateAuthTokens(user);

    const getToken = await prisma.token.findFirst({
      where: { userId: user.id },
    });

    if (getToken) {
      const tokens = await prisma.token.update({
        where: { id: getToken.id },
        data: { blacklisted: true },
      });

      return { user, tokens };
    }
  }
};

// for (let i = 0; i <= 100; i++) {
//   addUser();
// }

const getUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

const getUsers = async (options) => {
  // const { search } = filter;
  let { page, size, search } = options;
  const skip = (page - 1) * size; // Menghitung skip yang ditampilkan per page

  const users = await prisma.user.findMany({
    skip: skip,
    take: size,
    include: {
      tokens: true,
      notes: true,
    },
    where: {
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
          },
        },
      ],
    },
    orderBy: { name: 'asc' },
  });

  let totalData = await prisma.user.count(); // Hitung total data
  let totalPage = Math.ceil(totalData / size); // Hitung total halaman

  if (totalData >= 10) {
    switch (size) {
      case 5:
        totalData -= 5;
        break;
      case 10:
        totalData -= 10;
        break;
      case 15:
        totalData -= 15;
        break;
      case 20:
        totalData -= 20;
        break;
    }
  }

  let iteration = page - 3 < 1 ? 1 : page - 3; //untuk number awal mualai di pagination
  const endFor = iteration + 5 <= totalPage ? iteration + 5 : page + (totalPage - page); // untuk number akhir di pagination

  //untuk hitung (angka awal pagination) jika (angka akhir) kurang dari (page + 4)
  //agar pagination tetap 1 sampai 6 (karena saya menampilkan antara 1 - 6 angka)
  if (endFor < page + 2) {
    iteration -= page + 2 - totalPage;
  }

  if (totalData <= 5 || totalData <= 10 || totalData <= 15 || totalData <= 20) {
    iteration = 1;
  }

  return { totalPage, totalData, users, page, size, iteration, endFor, search };
};

const getUserById = async (userId) => {
  const getUserById = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      notes: true,
      tokens: true,
    },
  });

  return getUserById;
};

const updateUserById = async (userId, userBody) => {
  const user = await getUserById(userId);

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan');

  if (user.role === 'admin') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Tidak bisa mengubah admin!');
  }

  const updateUser = await prisma.user.update({
    where: { id: user.id },
    data: userBody,
  });

  return updateUser;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan');
  if (user.role === 'admin') throw new ApiError(httpStatus.BAD_REQUEST, 'Tidak bisa hapus admin!');

  const deleteUser = await prisma.user.delete({
    where: { id: userId },
  });

  return deleteUser;
};

module.exports = {
  createUser,
  addUser,
  getUserByEmail,
  getUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
