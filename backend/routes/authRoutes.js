const express = require('express');
const { register, login } = require('../controllers/authController');

const router = express.Router();

module.exports = (pool) => {
  // Auth routes delegating to controllers
  router.post('/register', register(pool));
  router.post('/login', login(pool));

  return router;
};
