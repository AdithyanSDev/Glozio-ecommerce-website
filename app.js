
const express = require('express');
const mongoose = require('mongoose');
const dotenv=require('dotenv')
const path=require('path')

const connectDB=require('./connection')
const app = express();

dotenv.config({path:'config.env'})
const PORT= process.env.PORT || 8080



connectDB();

app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const authRoutes = require('./routes/authRoutes');

app.use(express.static('public'));
app.use('/', authRoutes);






app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
