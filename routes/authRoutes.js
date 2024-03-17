const express = require('express');
const router = express.Router();
const { redirectToUserLogin, userLogin, registerUser, renderOTPPage,changePassword,  verifyOTP, resendOTP, logout,renderChangePasswordPage,renderForgotPasswordPage,forgotpassword,renderForgotPassOTPPage,verifyForgotPassOTP,resetPasswordpage,resetpassword } = require('../controllers/authController');
const{renderUserprofile,renderAddress,addAddress,renderUpdateAddress,renderEdit, editAddress,deleteAddress,addAddressCheckOut, editprofile,getCouponData}=require('../controllers/profileController')
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
router.get('/edit',verifyToken,renderEdit)
router.post('/user/edit',verifyToken,editprofile);
router.get('/user/address', verifyToken, renderAddress); 
router.post('/addaddress', verifyToken, addAddress);
router.post('/addaddresscheckout',verifyToken,addAddressCheckOut);
router.get('/addresses/:id',verifyToken ,renderUpdateAddress);
router.post('/addresses/:id',verifyToken, editAddress);
router.delete('/user/address/:id',deleteAddress);
router.get('/user/resetpassword',verifyToken, renderChangePasswordPage);
router.post('/user/change-password', verifyToken, changePassword);
// Route for rendering the forgot password page
router.get('/forgot-password', renderForgotPasswordPage);
router.post('/forgotpassword',forgotpassword)
router.get('/forgotpass-otp', renderForgotPassOTPPage);
router.post('/forgotpass-otp',verifyForgotPassOTP);
router.get('/reset-password', resetPasswordpage);
router.post('/resetpassword',resetpassword)

router.get('/coupons',verifyToken, getCouponData);


router.get('/admin/login', (req, res) => {
  res.render('adminlogin'); // Render the admin login page
});

module.exports = router;
