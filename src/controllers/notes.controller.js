const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { notesService, animalService } = require('../services');

const createNotes = catchAsync(async (req, res) => {
  const notes = await notesService.createNotes(req.body);

  res.status(httpStatus.CREATED).send({
    status: httpStatus.CREATED,
    message: 'Create Notes Success',
    data: notes,
  });
});

const getMyNotes = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const getNotes = await notesService.getMyNotes(userId);

  res.status(httpStatus.OK).render('notes/notesUser.ejs', {
    title: 'my-animal',
    errorMessage: null,
    notes: getNotes.getNotes,
    user: getNotes.getUser,
  });
});

const getNotesById = catchAsync(async (req, res) => {
  const notes = await notesService.getNotesById(req.params.notesId);

  if (!notes) throw new ApiError(httpStatus.NOT_FOUND, 'Catatan tidak ditemukan');

  res.status(httpStatus.OK).render('notes/getNotes.ejs', {
    title: 'Detail-notes',
    errorMessage: null,
    notes: notes,
  });
});

const getNotes = catchAsync(async (req, res) => {
  const options = {
    page: parseInt(req.query.page, 10) || 1, // Default page adalah 1
    size: parseInt(req.query.size, 10) || 5, // Default size adalah 5
    search: req.query.search || '',
  };

  const notes = await notesService.getNotes(options);

  res.status(httpStatus.OK).render('notes/notesAdmin.ejs', {
    title: 'Payments-admin',
    errorMessage: null,
    notes: notes.notes,
    currentPage: notes.page,
    totalData: notes.totalData,
    totalPage: notes.totalPage,
    pageSize: notes.size,
    iteration: notes.iteration,
    endFor: notes.endFor,
    search: options.search,
  });
});

const updateNotesView = catchAsync(async (req, res) => {
  const notes = await notesService.getNotesById(req.params.notesId);

  res.status(httpStatus.OK).render('notes/editNotes.ejs', {
    title: 'Edit-notes',
    errorMessage: null,
    notes: notes,
  });
});

const updateNotesById = catchAsync(async (req, res) => {
  await notesService.updateNotesById(req.params.notesId, req.body);

  res.status(httpStatus.OK).redirect('/api/notes');
});

const deleteNotesById = catchAsync(async (req, res) => {
  await notesService.deleteNotesById(req.params.notesId);

  res.status(httpStatus.OK).redirect('/api/notes');
});

module.exports = {
  createNotes,
  getMyNotes,
  getNotesById,
  getNotes,
  updateNotesView,
  updateNotesById,
  deleteNotesById,
};
