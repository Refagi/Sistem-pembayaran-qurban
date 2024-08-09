const httpStatus = require('http-status');
const prisma = require('../../prisma/index');
const ApiError = require('../utils/ApiError');

const createPaymentView = async ({ user_id }) => {
  const getUser = await prisma.user.findUnique({
    where: { id: user_id },
    include: {
      notes: true,
    },
  });

  if (!getUser) throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan!');

  let getAnimalId;
  let getNoteId;
  let notes = getUser.notes;
  if (notes.length > 0) {
    const note = notes[0];
    getNoteId = note.id;
    getAnimalId = note.animal_id;
  }

  if (!getAnimalId || !getNoteId) throw new ApiError(httpStatus.NOT_FOUND, 'Id hewan atau Id catatan tidak ditemukan!');

  const getAnimal = await prisma.animals.findUnique({ where: { id: getAnimalId } });
  const getNotes = await prisma.notes.findUnique({ where: { id: getNoteId } });

  if (!getAnimal || !getNotes) throw new ApiError(httpStatus.NOT_FOUND, 'Hewan qurban atau catatan tidak ditemukan!');

  return { getAnimal, getNotes };
};

const createPayment = async ({ user_id, bodies }) => {
  const getUser = await prisma.user.findUnique({
    where: { id: user_id },
    include: {
      notes: true,
    },
  });

  let getAnimalId;
  let getNoteId;
  let notes = getUser.notes;
  notes.forEach((note) => {
    (getNoteId = note.id), (getAnimalId = note.animal_id);
  });

  const getAnimal = await prisma.animals.findUnique({
    where: { id: getAnimalId },
  });

  const getNotes = await prisma.notes.findUnique({
    where: { id: getNoteId },
  });

  if (!getAnimal) throw new ApiError(httpStatus.NOT_FOUND, 'Hewan qurban tidak ditemukan!');
  if (!getNotes) throw new ApiError(httpStatus.NOT_FOUND, 'Catatan tidak ditemukan!');

  if (bodies.amount > getAnimal.price)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Jumlah pembayaran melebihi harga hewan qurban!');

  if (bodies.status_animal !== getAnimal.status)
    throw new ApiError(httpStatus.BAD_REQUEST, 'status pembayaran tidak sama dengan status hewan qurban!');

  const paymentAmount = getNotes.payment_amount + bodies.amount;
  let paymentPaid = false;
  if (paymentAmount === getAnimal.price) {
    paymentPaid = true;
  }
  if (paymentAmount > getAnimal.price)
    throw new ApiError(httpStatus.BAD_REQUEST, 'Pastikan pembayaran tidak melebihi harga!');

  await prisma.notes.update({
    where: { id: getNoteId },
    data: { payment_amount: paymentAmount, paidOff: paymentPaid },
  });

  if (paymentPaid) {
    await prisma.animals.update({
      where: { id: getAnimalId },
      data: { status: 'sold' },
    });
  }

  const resultPayment = await prisma.payment.create({
    data: bodies,
  });

  return { resultPayment, getAnimal, getNotes, getUser };
};

const getPaymentByIdUser = async () => {
  const result = await prisma.payment.findMany({
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (result.length < 1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Belum ada pembayaran!');
  }

  let paymentId;
  result.forEach((payment) => {
    paymentId = payment.id;
  });

  return { result, paymentId };
};

const getPaymentById = async (paymentId) => {
  const result = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  return result;
};

const getPayments = async (options) => {
  let { page, size, search } = options;
  const skip = (page - 1) * size; // Menghitung skip yang ditampilkan per page

  const payments = await prisma.payment.findMany({
    skip: skip,
    take: size,
    where: {
      OR: [
        {
          handphone: {
            contains: search,
          },
        },
        {
          name: {
            contains: search,
          },
        },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  let totalData = await prisma.payment.count(); // Hitung total data
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

  return { totalPage, totalData, payments, page, size, iteration, endFor, search };
};

const updatePaymentById = async (paymentId, paymentBody) => {
  console.log(paymentId);
  const payment = await getPaymentById(paymentId);

  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, 'Pembayaran tidak ditemukan!');

  const getAnimal = await prisma.animals.findUnique({
    where: { id: payment.animal_id },
  });

  const getNotes = await prisma.notes.findUnique({
    where: { id: payment.notes_id },
  });

  if (!getNotes) throw new ApiError(httpStatus.NOT_FOUND, 'Catatan tidak ditemukan');

  if (!getAnimal) throw new ApiError(httpStatus.NOT_FOUND, 'Hewan qurban tidak ditemukan');

  if (paymentBody.status_animal !== getAnimal.status)
    throw new ApiError(httpStatus.BAD_REQUEST, 'status pembayaran tidak sama dengan status hewan qurban!');

  await prisma.notes.update({
    where: { id: payment.notes_id },
    data: { name: paymentBody.name },
  });

  const result = await prisma.payment.update({
    where: { id: paymentId },
    data: paymentBody,
  });

  return result;
};

const deletePaymentById = async (paymentId) => {
  const payment = await getPaymentById(paymentId);
  const getNotes = await prisma.notes.findUnique({
    where: { id: payment.notes_id },
  });

  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, 'Pembayaran tidak ditemukan!');
  const paymentAmount = getNotes.payment_amount - payment.amount;
  const paidPayment = getNotes.paidOff === true ? false : false;

  await prisma.notes.update({
    where: { id: payment.notes_id },
    data: { payment_amount: paymentAmount, paidOff: paidPayment },
  });

  const result = await prisma.payment.delete({
    where: { id: paymentId },
  });

  return result;
};

module.exports = {
  createPaymentView,
  createPayment,
  getPaymentByIdUser,
  getPaymentById,
  getPayments,
  updatePaymentById,
  deletePaymentById,
};
