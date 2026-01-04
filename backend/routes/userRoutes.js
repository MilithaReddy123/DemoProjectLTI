const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

module.exports = (pool) => {
  // All user routes protected with JWT verification
  router.get('/', verifyToken, getAllUsers(pool));
  router.get('/:id', verifyToken, getUserById(pool));
  router.post('/', verifyToken, createUser(pool));
  router.put('/:id', verifyToken, updateUser(pool));
  router.delete('/:id', verifyToken, deleteUser(pool));

  return router;
};

