const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const router = express.Router();

module.exports = (pool) => {
  // User routes delegating to controllers
  router.get('/', getAllUsers(pool));
  router.get('/:id', getUserById(pool));
  router.post('/', createUser(pool));
  router.put('/:id', updateUser(pool));
  router.delete('/:id', deleteUser(pool));

  return router;
};

