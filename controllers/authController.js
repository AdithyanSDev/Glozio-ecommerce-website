const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const Product = require('../models/product');
const Category= require('../models/category')
const Review = require('../models/review');



exports.renderHomePage = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });
    // Fetch review counts for each product
    const productReviewCounts = await Promise.all(products.map(async product => {
      const reviewCount = await Review.countDocuments({ productId: product._id });
      return { productId: product._id, reviewCount };
    }));

    // Create a map of product IDs to review counts for easy access
    const reviewCountMap = productReviewCounts.reduce((map, obj) => {
      map[obj.productId] = obj.reviewCount;
      return map;
    }, {});

    const categories = await Category.find({ isDeleted: false }).populate('products');
    const token = req.cookies.token; // Retrieve token from cookies
    console.log("token from cookies:", token);
    res.render('home', { products, token, categories, reviewCountMap });   
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Redirect to user login page
exports.redirectToUserLogin = (req, res) => {
  console.log('Redirecting to user login page');
  res.redirect('/user/login');
};


exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });


    if (user) {
      if (user.isBlocked =="Blocked") {
        return res.render('userlogin', { error: 'Your account has been blocked. Please contact the administrator.' });
      }

      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set token in a cookie with an expiration time of 1 hour
        res.cookie('token', token, { maxAge: 3600000 });
        return res.redirect('/');
      }
    }

    res.render('home', { error: 'Invalid email or password' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



// Function to generate a random string (OTP)
const generateRandomString=()=>{
  const otp=Math.floor(1000 + Math.random() * 9999);;
  return String(otp);
}


exports.registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    req.session.userData = { name, email, password };
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateRandomString(4);
    await sendOtpEmail(email, otp);
    console.log("register page otp ",otp)

   
    req.session.otp = { code: otp, timestamp: Date.now() };

    const successMessage = 'User registered successfully!';
    if(successMessage){
      res.redirect('/api/otp')
    }
    console.log(successMessage); 

    res.locals.success = successMessage; 
    next();
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};



// Function to send OTP email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_ADDRESS, 
      pass: process.env.EMAIL_PASSWORD
    }
  });
  const mailOptions = {
    from: process.env.EMAIL_ADDRESS, 
    to: email,
    subject: 'One-Time Password (OTP) for Authentication',
    text: `Your Authentication OTP is: ${otp}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error:', error);
  }
};



// OTP verification route handler
exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const sessionOtp = req.session.otp;
    if (otp === sessionOtp.code && (Date.now() - sessionOtp.timestamp) <= 30000) { 
      const userData = req.session.userData;
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = new User({ name: userData.name, email: userData.email, password: hashedPassword });
      await newUser.save();
      delete req.session.userData;
      delete req.session.otp;
      res.render('userlogin')
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


exports.renderOTPPage = (req, res) => {
     // Function to calculate remaining time
     function calculateRemainingTime(timestamp) {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - timestamp) / 1000;
      const remainingTime = Math.max(0, 30 - elapsedTime); 
      return formatTime(remainingTime);
  }

  // Function to format time
  function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }
  console.log("Rendering OTP page");
  if (req.session.user) {
    res.redirect('/userHome');
  } else {
    const timer = calculateRemainingTime(req.session.otp.timestamp); 
    res.render('otp', { timer }); 
  }
};

// Function to handle OTP verification post request
exports.verifyOTPPost = async (req, res) => {
  try {
    const { otp } = req.body;
    const storedOTP = req.session.otp; 
    if (otp === storedOTP) {
      const { name, email, password } = req.session.userData; 
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();
      delete req.session.userData;
      delete req.session.otp;
      res.render('userlogin')
    } else {
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
//resend
exports.resendOTP = async (req, res) => {
  try {
      const newOtp = generateRandomString(4);
      console.log(newOtp);
      req.session.otp = { code: newOtp, timestamp: Date.now() };
      await sendOtpEmail(req.session.userData.email, newOtp); 
      res.json({ success: true, message: "OTP has been resent successfully" });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


exports.logout = async (req, res) => {
  try {
    // Clear the token cookie
    res.clearCookie('token');
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

//render the productlist.ejs
exports.productsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId).populate('products');
    if (!category) {
      return res.status(404).send('Category not found');
    }
    const productIds = category.products.map(product => product._id);
    const products = await Product.find({ _id: { $in: productIds } });
    const reviews = await Review.find({ productIds });
    const reviewCount = await Review.countDocuments({ productIds });
    res.render('productlist', { category, products,reviewCount,categoryId });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};



