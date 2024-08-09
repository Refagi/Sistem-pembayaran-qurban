const httpStatus = require('http-status');
const prisma = require('../../prisma/index');
const ApiError = require('../utils/ApiError');

const createNotes = async (notesBody) => {
  const result = await prisma.notes.create({
    data: notesBody,
  });

  return result;
};

const getMyNotes = async (user_id) => {
  const getUser = await prisma.user.findUnique({
    where: { id: user_id },
    include: {
      tokens: true,
      notes: true,
    },
  });

  if (!getUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan!');
  }

  let notes_id;
  let getNote = getUser.notes;
  getNote.forEach((note) => {
    notes_id = note.id;
  });

  if (!notes_id) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Anda belum punya catatan, silahkan pilih hewan qurban!');
  }

  const getNotes = await prisma.notes.findUnique({
    where: { id: notes_id },
    include: {
      payments: true,
    },
  });

  return { getUser, getNotes };
};

const getNotesById = async (notesId) => {
  const result = await prisma.notes.findUnique({
    where: { id: notesId },
    include: {
      payments: true,
    },
  });

  return result;
};

const getNotes = async (options) => {
  let { page, size, search } = options;
  const skip = (page - 1) * size; // Menghitung skip yang ditampilkan per page

  const notes = await prisma.notes.findMany({
    skip: skip,
    take: size,
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
    orderBy: { createdAt: 'asc' },
  });

  let totalData = await prisma.notes.count(); // Hitung total data
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

  return { totalPage, totalData, notes, page, size, iteration, endFor, search };
};

const updateNotesById = async (notesId, notesBody) => {
  const notes = await getNotesById(notesId);

  if (!notes) throw new ApiError(httpStatus.NOT_FOUND, 'Catatan tidak ditemukan!');

  const result = await prisma.notes.update({
    where: { id: notesId },
    data: notesBody,
  });

  return result;
};

const deleteNotesById = async (notesId) => {
  const notes = await getNotesById(notesId);

  if (!notes) throw new ApiError(httpStatus.NOT_FOUND, 'Catatan tidak ditemukan');

  const result = await prisma.notes.delete({
    where: { id: notesId },
  });

  return result;
};

module.exports = {
  createNotes,
  getMyNotes,
  getNotesById,
  getNotes,
  updateNotesById,
  deleteNotesById,
};
