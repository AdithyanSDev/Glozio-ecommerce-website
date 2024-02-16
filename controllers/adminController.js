const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');

// Function to hash a password using bcrypt
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Admin authentication
exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  const predefinedAdminEmail = 'adithyansdev46@gmail.com';
  const predefinedAdminPassword = '971919'; 

  try {
    if (email === predefinedAdminEmail) {
      const predefinedAdminPasswordHash = await hashPassword(predefinedAdminPassword); 
      const match = await bcrypt.compare(password, predefinedAdminPasswordHash);

      if (match) {
        const token = jwt.sign({ userId: predefinedAdminEmail }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set up session
        req.session.admin = predefinedAdminEmail;
        req.session.token = token; // Set the token in session

        // Log admin details to console
        console.log(`Admin logged in: ${predefinedAdminEmail}`);
        console.log("admin token", token);

        // Redirect to admin home page
        res.render('adminhome');
        return;
      }
    }

    // If admin authentication fails, redirect back to admin login page
    res.redirect('/adminlogin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

//admin home
exports.adminhome = async(req,res)=>{
  try{
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '-1');
   res.render('adminhome')
  }catch{
    res.send(500).send('Internal server error')
  }
}

// List users
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.render('usermanagement', { users });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Block user
exports.blockUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    await User.findByIdAndUpdate(userId, { isBlocked: true });
    res.redirect('/admin/usermanagement');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    await User.findByIdAndUpdate(userId, { isBlocked: false });
    res.redirect('/admin/usermanagement');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.adminlogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/adminlogin');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
};
