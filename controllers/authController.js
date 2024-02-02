
const User = require('../models/user'); // Assuming you have a User model

// User authentication
exports.userLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ username, password });
  
      if (user) {
        req.session.user = user;
        res.redirect('/user/dashboard');
      } else {
        res.render('user-login', { error: 'Invalid username or password' });
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
      const newUser = new User({ name, email, password });
      await newUser.save();
  
      res.send('User registered successfully!');
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
