const express = require('express');
const router = express.Router();


const { adminLogin } = require('../controllers/adminController');
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

router.get('/admin/login', (req, res) => {
  res.render('adminlogin'); // Render the admin login page
});


router.post('/admin/login', adminLogin);


module.exports = router;
