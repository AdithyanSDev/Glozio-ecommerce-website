const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');
const connectDB = require('./connection.js');
const authRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const nocache = require('nocache');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const adminRoutes = require('./routes/admin.js');
const cartRoutes = require('./routes/cart.js');
const User = require('./models/user.js'); 
const jwt = require('jsonwebtoken')
const { verifyToken, isAdmin } = require('./middleware/authMiddleware.js');

dotenv.config({ path: 'config.env' });
const PORT = process.env.PORT || 8080;

connectDB();

const app = express();

app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());

// Configure express-session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-default-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Configure passport with Google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (!user) {
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        password: 'defaultPassword'
      });
      await user.save();
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
  console.log("haii",token)
    done(null, { user, token });
  } catch (error) {
    done(error, null);
  }
}));


passport.serializeUser((user, done) => {
  const sessionUser = {
    id: user._id,
    name: user.name,
    email: user.email
  };
  done(null, sessionUser);
});

passport.deserializeUser(async (sessionUser, done) => {
  try {
    const user = await User.findById(sessionUser.id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.use('/lib', express.static(path.join(__dirname, 'lib')));


app.use('/', homeRoutes);
app.use('/api', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', cartRoutes);

app.get('/adminlogin', (req, res) => {
  res.render('adminlogin'); 
});


app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/api/user/login' }), (req, res) => {
  // Successful authentication, set token in cookie and redirect home
  const token = req.user.token; // Assuming the token is stored in req.user.token after successful authentication
  res.cookie('token', token, { maxAge: 3600000 }); // Set token in cookie with an expiration time of 1 hour
  res.redirect('/');
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
