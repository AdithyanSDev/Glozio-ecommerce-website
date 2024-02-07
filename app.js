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


const app = express();

dotenv.config({ path: 'config.env' });
const PORT = process.env.PORT || 8080;

connectDB();
const adminRoutes = require('./routes/admin'); // Adjust the path accordingly

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

app.use('/', homeRoutes);
app.use('/admin', adminRoutes);
app.use('/api', authRoutes);


app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));


app.get('/adminlogin', (req, res) => {
  // Render admin login page
  res.render('adminlogin'); // Assuming your admin login page is named 'adminlogin.ejs'
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
