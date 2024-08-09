const { faker } = require('@faker-js/faker');
const prisma = require('../../prisma');
const { v4 } = require('uuid');
const { animalOne, animalTwo } = require('./animal.fixture');
const { notesOne, notesTwo } = require('./notes.fixture');

// let randomIndex = Math.round(Math.random());
// let choseStatusAnimal = randomIndex === 0 ? 'available' : 'sold';

const paymentOne = {
  id: v4(),
  animal_id: animalOne.id,
  notes_id: notesOne.id,
  amount: 2000000,
  status_animal: animalOne.status,
};

const paymentTwo = {
  id: v4(),
  animal_id: animalTwo.id,
  notes_id: notesTwo.id,
  amount: 1000000,
  status_animal: animalOne.status,
};

const insertPayments = async (payments) => {
  try {
    const result = await prisma.payment.createMany({
      data: payments,
      skipDuplicates: true,
    });
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  paymentOne,
  paymentTwo,
  insertPayments,
};
