const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/adminController');
const { userLogin, registerUser,verifyOTP } = require('../controllers/authController');
const { redirectToUserLogin } = require('../controllers/authController');

// Sign in button route
router.get('/signin', redirectToUserLogin);

// Root path - redirect to login page
router.get('/user/login', (req, res) => {
  res.render('userlogin'); // Assuming your login.ejs file is in the 'views' directory
});

// User login route
router.post('/user/login', userLogin);

// router.get('/user/register', (req, res) => {
//   res.render('userlogin'); // Replace 'userlogin' with the actual name of your registration page
// });

// // User registration route
// router.post('/user/register', (req, res, next) => {
//   // Redirect to OTP page after registration
//   registerUser(req, res, next);
// }, (req, res) => {
//   res.redirect('/otp'); // Redirect to the OTP page after registration
// });

router.post('/user/register',registerUser)

// OTP page route
router.get('/otp', (req, res) => {
  res.render('otp');
});

router.post('/otp',verifyOTP)

router.get('/admin/login', (req, res) => {
  res.render('adminlogin'); // Render the admin login page
});


router.post('/admin/login', adminLogin);


module.exports = router;
