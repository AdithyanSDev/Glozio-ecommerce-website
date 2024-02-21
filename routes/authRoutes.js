const express = require('express');
const router = express.Router();
const { redirectToUserLogin, userLogin, registerUser, renderOTPPage, verifyOTP, resendOTP, logout ,getProfile, renderUserprofile} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');



router.get('/signin', redirectToUserLogin);
router.get('/user/login', (req, res) => {
  res.render('userlogin'); // Assuming your login.ejs file is in the 'views' directory
});

router.post('/user/login', userLogin);
router.post('/user/register', registerUser);
router.get('/otp', renderOTPPage);
router.post('/otp', verifyOTP);
router.post('/resend-otp',resendOTP );
router.get('/user/logout',logout)
router.get('/user/profile',verifyToken,renderUserprofile)
router.get('/user/profile' ,verifyToken,getProfile);

router.get('/admin/login', (req, res) => {
  res.render('adminlogin'); // Render the admin login page
});

module.exports = router;
