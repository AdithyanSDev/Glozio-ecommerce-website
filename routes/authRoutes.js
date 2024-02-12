const express = require('express');
const router = express.Router();
const { redirectToUserLogin, userLogin, registerUser, renderOTPPage, verifyOTP, resendOTP } = require('../controllers/authController');

router.get('/signin', redirectToUserLogin);

router.get('/user/login', (req, res) => {
  res.render('userlogin'); // Assuming your login.ejs file is in the 'views' directory
});

router.post('/user/login', userLogin);
router.post('/user/register', registerUser);
router.get('/otp', renderOTPPage);
router.post('/otp', verifyOTP);
router.post('/resend-otp', resendOTP);

router.get('/admin/login', (req, res) => {
  res.render('adminlogin'); // Render the admin login page
});

module.exports = router;
