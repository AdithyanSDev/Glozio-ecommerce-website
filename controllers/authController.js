const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// User authentication
exports.userLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
      // User authenticated
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

      req.session.user = user;
      res.cookie('token', token); // Set the token as a cookie

      console.log('User logged in:', user); // Log user details to console

      res.redirect('/home');
    } else {
      res.render('userlogin', { error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Register a new user
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User({ name, email, password: hashedPassword });
    await newUser.save();

    const successMessage = 'User registered successfully!';
    console.log(successMessage); 

    res.render('userlogin', { success: successMessage });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

