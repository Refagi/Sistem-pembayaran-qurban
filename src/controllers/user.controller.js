const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService, tokenService, notesService } = require('../services');

const addUser = catchAsync(async (req, res) => {
  await userService.addUser(req.body);

  res.status(httpStatus.CREATED).redirect('/api/users');
});

const getUserByEmail = catchAsync(async (req, res) => {
  const user = await userService.getUserByEmail(req.params.email);

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan');

  res.status(httpStatus.OK).send({
    status: httpStatus.OK,
    message: 'Get User By Email Success',
    data: user,
  });
});

const getUsers = catchAsync(async (req, res) => {
  // const filter = { role: req.query.search || ''}; // Default role jika kosong
  const options = {
    page: parseInt(req.query.page, 10) || 1, // Default page adalah 1
    size: parseInt(req.query.size, 10) || 5, // Default size adalah 5
    search: req.query.search || '',
  };

  const result = await userService.getUsers(options);

  res.status(httpStatus.OK).render('view-user/users', {
    title: 'users',
    errorMessage: null,
    currentPage: result.page,
    totalData: result.totalData,
    totalPage: result.totalPage,
    data: result.users,
    pageSize: result.size,
    iteration: result.iteration,
    endFor: result.endFor,
    search: options.search,
  });
});

const getUserHeader = catchAsync(async (req, res) => {
  const getUser = req.user.id;
  const users = await userService.getUserById(getUser);

  if (!users || !users.notes || users.notes.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'User tidak ditemukan');
  }

  res.render('header/headerUser.ejs', { user: users });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User tidak ditemukan');

  res.status(httpStatus.OK).render('view-user/getUser.ejs', { title: 'Detail User', user: user || null });
});

const updateUserView = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  res.render('view-user/editUser.ejs', { title: 'Edit User', user: user || null, errorMessage: null });
});

const updateUserById = catchAsync(async (req, res) => {
  await userService.updateUserById(req.params.userId, req.body);
  res.status(httpStatus.OK).redirect('/api/users');
});

const deleteUserById = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);

  res.status(httpStatus.OK).redirect('/api/users');
});

module.exports = {
  addUser,
  getUserByEmail,
  getUsers,
  getUserHeader,
  getUserById,
  updateUserView,
  updateUserById,
  deleteUserById,
};
