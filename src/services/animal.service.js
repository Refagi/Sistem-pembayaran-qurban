const httpStatus = require('http-status');
const prisma = require('../../prisma/index');
const ApiError = require('../utils/ApiError');
const { faker } = require('@faker-js/faker');

const createAnimal = async (animalBody) => {
  // const result = await prisma.animals.create({
  //   data: {
  //     type: faker.helpers.arrayElement(['sapi', 'kambing', 'domba']),
  //     price: parseFloat(faker.commerce.price()),
  //     status: faker.helpers.arrayElement(['available', 'sold']),
  //     weight: parseFloat(faker.number.int({ min:100, max:350  })),
  //     gender: faker.helpers.arrayElement(['male', 'female']),
  //     age: faker.number.int({ min: 1, max: 5 })
  //   }
  // });
  const result = await prisma.animals.create({
    data: animalBody,
  });

  return result;
};

// for (let i = 0; i <= 20; i++) {
//   createAnimal();
// }

const selectAnimal = async ({ animal_id, user_id }) => {
  const animal = await prisma.animals.findUnique({
    where: { id: animal_id },
    include: {
      notes: true,
      payments: true,
    },
  });

  console.log('animal', animal);
  const user = await prisma.user.findUnique({
    where: { id: user_id },
    include: {
      notes: true,
    },
  });

  if (!animal) throw new ApiError(httpStatus.NOT_FOUND, 'Hewan qurban tidak ditemukan!');
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan!');

  if (animal.status === 'sold') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Hewan qurban telah terjual');
  }

  if (animal.notes.length >= 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Hewan qurban telah dipilih, silahkan pilih hewan qurban yang lain!');
  }

  if (user.notes.length >= 1) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Anda hanya bisa memilih satu hewan qurban');
  }

  const result = await prisma.notes.create({
    data: {
      user_id: user.id,
      animal_id: animal.id,
      payment_amount: 0,
      paidOff: false,
      name: user.name,
      email: user.email,
    },
    include: { Animal: true },
  });

  return { result, user, animal };
};

const getAnimalById = async (animalId) => {
  const animals = await prisma.animals.findUnique({
    where: { id: animalId },
    include: {
      notes: true,
      payments: true,
    },
  });

  return animals;
};

const getMyAnimal = async (user_id) => {
  const getUser = await prisma.user.findUnique({
    where: { id: user_id },
    include: {
      tokens: true,
      notes: true,
    },
  });

  if (!getUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan');
  }

  let animal_id;
  let getAnimalNotes = getUser.notes;
  getAnimalNotes.forEach((animal) => {
    animal_id = animal.animal_id;
  });

  if (!animal_id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Silahkan pilih hewan qurban terlebih dahulu');
  }

  const getAnimal = await prisma.animals.findUnique({
    where: { id: animal_id },
  });

  return { getUser, getAnimal };
};

const getAnimalsAdmin = async (options) => {
  let { page, size, search } = options;
  const skip = (page - 1) * size; // Menghitung skip yang ditampilkan per page

  const animals = await prisma.animals.findMany({
    skip: skip,
    take: size,
    include: {
      payments: true,
      notes: true,
    },
    where: {
      OR: [
        {
          type: {
            contains: search,
          },
        },
        {
          status: {
            contains: search,
          },
        },
      ],
    },
    orderBy: { price: 'asc' },
  });

  // console.log('search', search)

  let totalData = await prisma.animals.count(); // Hitung total data
  let totalPage = Math.ceil(totalData / size); // Hitung total halaman
  // console.log('before totalData', totalData)
  // console.log('before totalPage', totalPage)

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

  // console.log('after', totalData)
  // console.log('after', totalPage)

  let iteration = page - 3 < 1 ? 1 : page - 3; //untuk number awal mualai di pagination
  const endFor = iteration + 5 <= totalPage ? iteration + 5 : page + (totalPage - page); // untuk number akhir di pagination

  //untuk hitung (angka awal pagination) jika (angka akhir) kurang dari (page + 4)
  //agar pagination tetap 1 sampai 6 (karena saya menampilkan antara 1 - 6 angka)
  if (endFor < page + 2) {
    iteration -= page + 2 - totalPage;
    // console.log('iteration', iteration)
  }

  if (totalData <= 5 || totalData <= 10 || totalData <= 15 || totalData <= 20) {
    iteration = 1;
  }

  return { totalPage, totalData, animals, page, size, iteration, endFor, search };
};

const getAnimals = async (filter) => {
  let { search } = filter;

  const animals = await prisma.animals.findMany({
    where: {
      OR: [
        {
          status: { contains: search },
        },
        {
          type: { contains: search },
        },
      ],
    },
    orderBy: { price: 'asc' },
  }); //masih ada bug search filter tidak bisa
  // console.log('data:', animals)

  return { animals, search };
};

const updateAnimalById = async (animalId, animalBody) => {
  console.log('animalId', animalId);
  const animal = await getAnimalById(animalId);

  if (!animal) throw new ApiError(httpStatus.NOT_FOUND, 'Hewan qurban tidak ditemukan!');

  const result = await prisma.animals.update({
    where: { id: animalId },
    data: animalBody,
  });

  return result;
};

const deleteAnimalById = async (animalId) => {
  const animal = await getAnimalById(animalId);

  if (!animal) throw new ApiError(httpStatus.NOT_FOUND, 'Hewan qurban tidak ditemukan');

  const result = await prisma.animals.delete({
    where: { id: animalId },
  });

  return result;
};

module.exports = {
  createAnimal,
  selectAnimal,
  getAnimalById,
  getMyAnimal,
  getAnimals,
  getAnimalsAdmin,
  updateAnimalById,
  deleteAnimalById,
};
