const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { paymentService } = require('../services');

const createPaymentView = catchAsync(async (req, res) => {
  const getUser = req.user.id;
  const payments = await paymentService.createPaymentView({ user_id: getUser });

  res.render('payments/paymentUser.ejs', {
    title: 'payment-qurban',
    errorMessage: null,
    payment: payments.resultPayment,
    animal: payments.getAnimal,
    notes: payments.getNotes,
  });
});

const createPayment = catchAsync(async (req, res) => {
  const getUser = req.user.id;
  const body = req.body;
  const payment = await paymentService.createPayment({ user_id: getUser, bodies: body });

  let message = (req.session.message = {
    type: 'success',
    message: 'Pembayaran berhasil!',
  });

  res.render('animals/myAnimal.ejs', {
    title: 'Payments',
    message: message || null,
    errorMessage: null,
    user: payment.getUser,
    animal: payment.getAnimal,
  });
});

const getPaymentByIdUser = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentByIdUser(req.params.paymentId);

  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, 'Pembayaran tidak ditemukan!');

  res.status(httpStatus.OK).render('payments/detailPayment.ejs', {
    title: 'detail-payment',
    errorMessage: null,
    data: payment.result,
    paymentId: payment.paymentId,
  });
});

const getPaymentById = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.paymentId);

  if (!payment) throw new ApiError(httpStatus.NOT_FOUND, 'Pembayaran tidak ditemukan!');

  res.status(httpStatus.OK).render('payments/getPayment.ejs', {
    title: 'Detail-payment-admin',
    errorMessage: null,
    payment: payment,
  });
});

const getPayments = catchAsync(async (req, res) => {
  const options = {
    page: parseInt(req.query.page, 10) || 1, // Default page adalah 1
    size: parseInt(req.query.size, 10) || 5, // Default size adalah 5
    search: req.query.search || '',
  };

  const payments = await paymentService.getPayments(options);

  res.status(httpStatus.OK).render('payments/paymentAdmin.ejs', {
    title: 'Payments-admin',
    errorMessage: null,
    payments: payments.payments,
    currentPage: payments.page,
    totalData: payments.totalData,
    totalPage: payments.totalPage,
    pageSize: payments.size,
    iteration: payments.iteration,
    endFor: payments.endFor,
    search: options.search,
  });
});

const updatePaymentView = catchAsync(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.paymentId);
  res.render('payments/editPayment.ejs', { title: 'Edit-payment', payment, errorMessage: null });
});

const updatePaymentById = catchAsync(async (req, res) => {
  await paymentService.updatePaymentById(req.params.paymentId, req.body);

  res.status(httpStatus.OK).redirect('/api/payments');
});

const deletePaymentById = catchAsync(async (req, res) => {
  await paymentService.deletePaymentById(req.params.paymentId);

  res.status(httpStatus.OK).redirect('/api/payments');
});

module.exports = {
  createPaymentView,
  createPayment,
  getPaymentByIdUser,
  getPaymentById,
  getPayments,
  updatePaymentView,
  updatePaymentById,
  deletePaymentById,
};
