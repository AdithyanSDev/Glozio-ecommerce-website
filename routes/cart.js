// routes/cart.js
const express = require('express');
const router = express.Router();
const users = require('../models/user')
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const {verifyToken } = require('../middleware/authMiddleware');


router.get('/cart',verifyToken, cartController.renderCartPage);
router.post('/addcart',verifyToken, cartController.addToCart);
router.put('/cart/:productId/increase', verifyToken, cartController.increaseQuantity);
router.delete('/cart/remove/:productId', verifyToken, cartController.removeFromCart);

//checkout
router.get("/checkout", verifyToken ,cartController.renderCheckout)


//order routes
router.get('/orderpage',verifyToken,orderController.renderorderPage)
router.post('/placeorder',verifyToken, orderController.placeOrder);

module.exports = router;
