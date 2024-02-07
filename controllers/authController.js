const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer')


// Render home page
exports.renderHomePage = (req, res) => {
 const token = req.session.token
 console.log("token form ",token)
  res.render('home',{token}); // Assuming your home.ejs file is in the 'views' directory
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


// Update the function to send OTP after registration
exports.registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User({ name, email, password: hashedPassword });
    await newUser.save();

    // Generate OTP and send it to the user's email
    const otp = generateRandomString(4); // Generate a 4-digit OTP
    await sendOtpEmail(email, otp);
    console.log("register page otp ",otp)

    // Store the OTP in the session or database for verification
    req.session.otp = otp;

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
    // const storedOTP = req.session.otp; // Retrieve the stored OTP from session
    
    const session_otp=req.session.otp;

 
    if (otp == session_otp) {
      console.log("executed")
      // If OTP matches, redirect to login page
      res.redirect('/api/user/login');
    } else {
    
      // If OTP doesn't match, redirect to registration page with an error message
      res.redirect('/api/user/register');
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Function to render the OTP page
exports.renderOTPPage = (req, res) => {
  if (req.session.user) {
    res.redirect('/userHome');
  } else {
    res.render('otp');
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

      res.status(200).json({ success: true, redirect: '/user/login' });
    } else {
      // OTP is incorrect
      res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
