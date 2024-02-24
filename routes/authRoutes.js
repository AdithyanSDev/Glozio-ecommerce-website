const express = require('express');
const router = express.Router();
const { redirectToUserLogin, userLogin, registerUser, renderOTPPage, verifyOTP, resendOTP, logout } = require('../controllers/authController');
const{renderUserprofile,renderAddress,addAddress,renderUpdateAddress, editAddress,deleteAddress,addAddressCheckOut}=require('../controllers/profileController')
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
router.get('/user/profile', verifyToken, renderUserprofile);
router.get('/user/address', verifyToken, renderAddress); 
router.post('/addaddress', verifyToken, addAddress);
router.post('/addaddresscheckout',verifyToken,addAddressCheckOut);
router.get('/addresses/:id',renderUpdateAddress);
router.post('/addresses/:id', editAddress);
router.delete('/user/address/:id',deleteAddress);

router.get('/admin/login', (req, res) => {
  res.render('adminlogin'); // Render the admin login page
});

module.exports = router;
