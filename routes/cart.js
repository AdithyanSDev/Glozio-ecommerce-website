// routes/cart.js
const express = require('express');
const router = express.Router();
const users = require('../models/user')
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const wishlistController = require('../controllers/wishlistController');
const {verifyToken } = require('../middleware/authMiddleware');


router.get('/cart',verifyToken, cartController.renderCartPage);
router.post('/addcart',verifyToken, cartController.addToCart);
router.put('/api/cart/:productId', verifyToken, cartController.updateCartQuantity);
router.delete('/cart/remove/:productId', verifyToken, cartController.removeFromCart);

//checkout
router.get("/checkout", verifyToken ,cartController.renderCheckout)


//order routes
router.get('/orderpage',verifyToken,orderController.renderorderPage)
router.post('/placeorder',verifyToken, orderController.placeOrder);
router.get('/orders',verifyToken,orderController.renderOrderList)
router.get('/orderlist',verifyToken,orderController.listUserOrders)
router.post('/orders/cancel',verifyToken,orderController.cancelOrder)
router.post('/orders/return',verifyToken,orderController.processReturn)
router.get('/orderdetails/:orderId/:productId',verifyToken,orderController.orderdetails)

router.get('/razorpaypage/:orderId', verifyToken,orderController.renderRazorpayPage);
router.post('/razorpay/pay/:orderId',verifyToken,orderController.razorsuccess)


// wishlist routes
router.get('/wishlist', verifyToken,wishlistController.getWishlist);
router.post('/wishlist/add',verifyToken, wishlistController.addToWishlist);
router.get('/wishlistremove/:productid',verifyToken, wishlistController.removeFromWishlist);

//coupen apply route
router.post('/applycoupon',verifyToken, cartController.applyCoupon);


module.exports = router;
