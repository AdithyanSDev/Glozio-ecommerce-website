const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');
const connectDB =require('./connection.js')
const authRoutes = require('./routes/authRoutes');
const nocache = require('nocache')


const app = express();

dotenv.config({ path: 'config.env' });
const PORT = process.env.PORT || 8080;

connectDB();

app.set('view engine', 'ejs');

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

app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

