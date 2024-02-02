const express = require('express');
const router = express.Router();

// Import your controllers
const { userLogin, registerUser } = require('../controllers/authController');

// Root path - redirect to login page
router.get('/', (req, res) => {
  res.render('userlogin'); // Assuming your login.ejs file is in the 'views' directory
});

// User login route
router.post('/user/login', userLogin);

// User registration route
router.post('/user/register', registerUser);

module.exports = router;
