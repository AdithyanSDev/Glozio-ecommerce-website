const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')
const Product = require('../models/product');
const Category= require('../models/category')


exports.renderHomePage = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });
    const categories = await Category.find({ isDeleted: false }).populate('products'); // Populate products in each category
    const token = req.session.token;
    console.log("token from:", token);
    res.render('home', { products, token, categories }); // Make sure categories is passed here
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

// User authentication
exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      if (user.isBlocked) {
        // User is blocked, render login page with an error message
        return res.render('userlogin', { error: 'Your account has been blocked. Please contact the administrator.' });
      }

      if (await bcrypt.compare(password, user.password)) {
        // User authenticated
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        req.session.user = user;
        res.cookie('token', token); // Set the token as a cookie
        req.session.token = token;

        res.redirect('/');
      } else {
        // Incorrect password
        res.render('userlogin', { error: 'Invalid email or password' });
      }
    } else {
      // User not found
      res.render('userlogin', { error: 'Invalid email or password' });
    }
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
    // Store user data in the session
    req.session.userData = { name, email, password };

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP and send it to the user's email
    const otp = generateRandomString(4); // Generate a 4-digit OTP
    await sendOtpEmail(email, otp);
    console.log("register page otp ",otp)

    // Store the OTP and its creation time in the session or database for verification
    req.session.otp = { code: otp, timestamp: Date.now() };

    const successMessage = 'User registered successfully!';
    if(successMessage){
      res.redirect('/api/otp')
    }
    console.log(successMessage); 

    res.locals.success = successMessage; // Pass success message to the template
    next(); // Call next middleware to redirect to the OTP page
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
      user: process.env.EMAIL_ADDRESS, //  email address
      pass: process.env.EMAIL_PASSWORD
    }
  });
  const mailOptions = {
    from: process.env.EMAIL_ADDRESS, // Specify the sender
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

    if (otp === sessionOtp.code && (Date.now() - sessionOtp.timestamp) <= 30000) { // Check if OTP is correct and not expired
      // If OTP matches and not expired, retrieve user data from session and register the user
      const userData = req.session.userData;

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create a new user
      const newUser = new User({ name: userData.name, email: userData.email, password: hashedPassword });
      await newUser.save();

      // Clear session data
      delete req.session.userData;
      delete req.session.otp;

      // Redirect to login page or send response indicating successful registration
      res.render('userlogin')
    } else {
      // If OTP doesn't match or expired, redirect to registration page with an error message
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


exports.renderOTPPage = (req, res) => {
  console.log("Rendering OTP page"); // Add this line
  if (req.session.user) {
    res.redirect('/userHome');
  } else {
    const timer = calculateRemainingTime(req.session.otp.timestamp); // Calculate remaining time for the timer
    res.render('otp', { timer }); // Pass timer value to the template
  }
};


// Function to handle OTP verification post request
exports.verifyOTPPost = async (req, res) => {
  try {
    const { otp } = req.body;
    const storedOTP = req.session.otp; // Retrieve the stored OTP from session

    if (otp === storedOTP) {
      // OTP is correct
      const { name, email, password } = req.session.userData; // Assuming you stored user data in session during registration
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user
      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();

      // Clear the session data
      delete req.session.userData;
      delete req.session.otp;

      res.render('userlogin')
    } else {
      // OTP is incorrect
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const newOTP = generateRandomString(4);
    const userEmail = req.session.userData.email;
    await sendOtpEmail(userEmail, newOTP);
    req.session.otp = { code: newOTP, timestamp: Date.now() };
    res.status(200).json({ success: true, message: "OTP has been resent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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

    // Extract product IDs from the category
    const productIds = category.products.map(product => product._id);

    // Find products using the extracted IDs
    const products = await Product.find({ _id: { $in: productIds } });

    res.render('productlist', { category, products });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

// exports.renderProductlist = async (req, res) => {
//   try {
//     const categoryId = req.params.categoryId;
//     console.log(categoryId)
    
//     // Find the category by ID
//     const category = await Category.findById(categoryId);

//     // If the category is not found, return a 404 error
//     if (!category) {
//       return res.status(404).send('Category not found');
//     }

//     // Find all products belonging to the category
//     const products = await Product.find({ category: categoryId });

//     // Render the product list page and pass the category and products data
//     res.render('productlist', { category, products });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Internal Server Error');
//   }
// };