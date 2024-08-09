const { faker } = require('@faker-js/faker');
const prisma = require('../../prisma');
const { v4 } = require('uuid');
const { userOne, userTwo } = require('./user.fixture');
const { animalOne, animalTwo } = require('./animal.fixture');

const notesOne = {
  id: v4(),
  user_id: userOne.id,
  animal_id: animalOne.id,
  payment_amount: 10000000,
  paidOff: false,
  customerName: userOne.name,
  customerEmail: userOne.email,
};

const notesTwo = {
  id: v4(),
  user_id: userTwo.id,
  animal_id: animalTwo.id,
  payment_amount: 20000000,
  paidOff: false,
  customerName: userTwo.name,
  customerEmail: userTwo.email,
};

const insertNotes = async (notes) => {
  try {
    const result = await prisma.notes.createMany({
      data: notes,
      skipDuplicates: true,
    });
    return result;
  } catch (err) {
    console.log(err);
  }
};

module.exports = {
  notesOne,
  notesTwo,
  insertNotes,
};
