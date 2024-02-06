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
  const predefinedAdminPassword = '971919'; // Plain text password

  try {
    if (email === predefinedAdminEmail) {
      const predefinedAdminPasswordHash = await hashPassword(predefinedAdminPassword); // Corrected line

      const match = await bcrypt.compare(password, predefinedAdminPasswordHash);

      if (match) {
        const token = jwt.sign({ userId: predefinedAdminEmail }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set up session
        req.session.user = predefinedAdminEmail;

        res.cookie('token', token); // Set the token as a cookie

        // Log admin details to console
        console.log(`Admin logged in: ${predefinedAdminEmail}`);

        if (req.session.user) {
          res.render('adminhome');
        } else {
          res.redirect('/adminlogin');
        }

        return;
      }
    }

    // Invalid email or password
    res.render('adminlogin', { error: 'Invalid email or password' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

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
