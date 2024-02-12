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
}, (accessToken, refreshToken, profile, done) => {
  // This function will be called when a user successfully authenticates with Google
  // You can perform actions like saving the user to your database here
  return done(null, profile);
}));

// Serialize and deserialize user (required for session support)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));
app.use('/lib', express.static(path.join(__dirname, 'lib')));


app.use('/', homeRoutes);
app.use('/api', authRoutes);
app.use('/admin',adminRoutes)

app.get('/adminlogin', (req, res) => {
  // Render admin login page
  res.render('adminlogin'); // Assuming your admin login page is named 'adminlogin.ejs'
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
