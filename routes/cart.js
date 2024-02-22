// routes/cart.js
const express = require('express');
const router = express.Router();
const users = require('../models/user')
const cartController = require('../controllers/cartController');
const {verifyToken } = require('../middleware/authMiddleware');


router.get('/cart',verifyToken, cartController.renderCartPage);
router.post('/addcart',verifyToken, cartController.addToCart);

module.exports = router;
