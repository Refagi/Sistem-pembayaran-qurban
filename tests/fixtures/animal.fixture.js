const { faker } = require('@faker-js/faker');
const prisma = require('../../prisma');
const { v4 } = require('uuid');

let randomIndex = Math.round(Math.random());
let choseAnimal = randomIndex === 0 ? 'kambing' : 'sapi';
let chosePriceAnimal = choseAnimal === 'kambing' ? 1000000 : 20000000;
let choseStatusAnimal = randomIndex === 0 ? 'available' : 'sold';

const animalOne = {
  id: v4(),
  type: choseAnimal,
  price: chosePriceAnimal,
  status: choseStatusAnimal,
};

const animalTwo = {
  id: v4(),
  type: choseAnimal,
  price: chosePriceAnimal,
  status: choseStatusAnimal,
};

const insertAnimals = async (animals) => {
  try {
    const result = prisma.animals.createMany({
      data: animals,
      skipDuplicates: true,
    });

    return result;
  } catch (error) {
    console.log(err);
  }
};

module.exports = {
  animalOne,
  animalTwo,
  insertAnimals,
};
