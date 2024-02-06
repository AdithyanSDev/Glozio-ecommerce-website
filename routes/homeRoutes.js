const express = require('express');
const router = express.Router();
const { renderHomePage } = require('../controllers/authController');

// Home route
router.get('/', renderHomePage); // Assuming your home.ejs file is in the 'views' directory

module.exports = router;
