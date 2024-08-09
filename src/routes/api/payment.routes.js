const express = require('express');
const { auth, authAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const paymentController = require('../../controllers/payment.controller');
const { paymentValidation } = require('../../validations');

const router = express.Router();

router.route('/').get(authAdmin(), paymentController.getPayments);

router.get('/create-payment', auth(), paymentController.createPaymentView);

router.route('/').post(auth(), validate(paymentValidation.createPayment), paymentController.createPayment);

router.get('/detail', auth(), paymentController.getPaymentByIdUser);

router.route('/edit/:paymentId').get(authAdmin(), paymentController.updatePaymentView);

router
  .route('/:paymentId')
  .get(authAdmin(), validate(paymentValidation.getPaymentById), paymentController.getPaymentById)
  .patch(authAdmin(), validate(paymentValidation.updatePaymentById), paymentController.updatePaymentById)
  .delete(authAdmin(), validate(paymentValidation.deletePaymentById), paymentController.deletePaymentById);

module.exports = router;
