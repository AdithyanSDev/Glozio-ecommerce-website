const express = require('express');
const router = express.Router();
const { adminLogin } = require('../controllers/adminController');
const { userLogin, registerUser,renderOTPPage,verifyOTP,resendOTP} = require('../controllers/authController');
const { redirectToUserLogin } = require('../controllers/authController');

// Sign in button route
router.get('/signin', redirectToUserLogin);

// Root path - redirect to login page
router.get('/user/login', (req, res) => {
  res.render('userlogin'); // Assuming your login.ejs file is in the 'views' directory
});

router.post('/user/login', userLogin);
router.post('/user/register',registerUser)
router.get('/otp', (req, res) => {
  res.render('otp');
});
router.get('/otp', renderOTPPage);
router.post('/otp',verifyOTP)
router.post('/resend-otp',resendOTP);

router.get('/admin/login', (req, res) => {
  res.render('adminlogin'); // Render the admin login page
});


router.post('/admin/login', adminLogin);


module.exports = router;
