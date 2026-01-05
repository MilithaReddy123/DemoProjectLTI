const express = require('express');
const multer = require('multer');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getLookups,
  downloadExcelTemplate,
  bulkUpsertFromExcel
} = require('../controllers/userController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = (pool) => {
  // Excel bulk feature
  router.get('/lookups', getLookups());
  router.get('/excel-template', downloadExcelTemplate(pool));
  router.post('/bulk', upload.single('file'), bulkUpsertFromExcel(pool));

  router.get('/', getAllUsers(pool));
  router.get('/:id', getUserById(pool));
  router.post('/', createUser(pool));
  router.put('/:id', updateUser(pool));
  router.delete('/:id', deleteUser(pool));

  return router;
};

