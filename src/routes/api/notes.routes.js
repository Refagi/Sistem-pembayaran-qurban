const express = require('express');
const notesController = require('../../controllers/notes.controller');
const validate = require('../../middlewares/validate');
const { notesValidation } = require('../../validations');
const { authAdmin, auth } = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .post(authAdmin(), validate(notesValidation.createNotes), notesController.createNotes)
  .get(authAdmin(), notesController.getNotes);

router.route('/my-notes/:userId').get(auth(), notesController.getMyNotes);

router.route('/edit/:notesId').get(authAdmin(), notesController.updateNotesView);

router
  .route('/:notesId')
  .get(auth(), validate(notesValidation.getNotesById), notesController.getNotesById)
  .patch(authAdmin(), validate(notesValidation.updateNotesById), notesController.updateNotesById)
  .delete(authAdmin(), validate(notesValidation.deleteNotesById), notesController.deleteNotesById);

module.exports = router;
