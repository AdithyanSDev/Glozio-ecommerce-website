const Category = require('../models/category'); 
const Product = require('../models/product')
const Cart = require('../models/cart')
const User = require('../models/user')
const Address=require('../models/address')
const Wallet=require('../models/wallet')
const Coupon =require('../models/coupon')
const Order=require('../models/order');
const { sub } = require('date-fns');

exports.renderCartPage = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const categories = await Category.find({ isDeleted: false });
            const userId = req.userId;
            if (!userId) {
                return res.redirect('/api/user/login');
            }

            // Retrieve user's cart and populate product fields including productOffer and categoryOffer
            const usercart = await Cart.find({ user: userId }).populate({
                path: 'product.productId',
                populate: [{ path: 'productOffer' }, { path: 'categoryOffer' }]
            });
            

            // Calculate subtotal from the cart database
            let subtotalFromCart = 0;
            usercart.forEach(cartItem => {
                cartItem.product.forEach(product => {
                    // Check if the product is in stock
                    if (product.productId.stock > 0) {
                        let productPrice = product.productId.sellingPrice;
                        // Apply product offer discount if applicable
                        if (product.productId.productOffer && product.productId.productOffer.expiryDate >= new Date()) {
                            productPrice -= product.productId.productOffer.discount;
                        }
                        // Apply category offer discount if applicable
                        if (product.productId.categoryOffer && product.productId.categoryOffer.expiryDate >= new Date()) {
                            productPrice -= (productPrice * (product.productId.categoryOffer.discount / 100));
                        }
                        subtotalFromCart += productPrice * product.quantity;
                    }
                });
            });
// Add this logging statement after populating the cart items
console.log('Populated user cart:', usercart);

// Add this logging statement inside the loop to check each product's categoryOffer
usercart.forEach(cartItem => {
    cartItem.product.forEach(product => {
        console.log('Product categoryOffer:', product.productId.categoryOffer);
    });
});

            // Retrieve available coupons
            const availableCoupons = await Coupon.find({});

            // Pass original subtotal and couponCode to the view
            const originalSubtotal = subtotalFromCart;
            const { couponCode } = req.body; // Initialize couponCode as empty string or retrieve it from somewhere

            res.render('cart', { usercart, categories, token, subtotalWithDiscount: subtotalFromCart, availableCoupons, originalSubtotal, couponCode });
        }
    } catch (error) {
        console.error(error);
        res.render('404page');
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.userId;

        // Fetch the product with associated productOffer and categoryOffer
        const product = await Product.findById(productId)
            .populate('productOffer')
            .populate('categoryOffer');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        // Initialize cart or find existing cart for the user
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, product: [], subtotal: 0 });
        }

        // Check if the product has a productOffer and categoryOffer, and apply discounts if available
        let finalPrice = product.sellingPrice;
        if (product.productOffer && product.productOffer.expiryDate >= new Date()) {
            const productDiscount = product.productOffer.discount;
            finalPrice -= productDiscount;
        } else if (product.categoryOffer && product.categoryOffer.expiryDate >= new Date()) {
            const categoryDiscount = product.categoryOffer.discount;
            finalPrice -= (finalPrice * (categoryDiscount / 100));
        }

        // Update cart with the new product details
        const existingProductIndex = cart.product.findIndex(item => item.productId.equals(productId));
        if (existingProductIndex !== -1) {
            cart.product[existingProductIndex].quantity += quantity;
        } else {
            cart.product.push({
                productId: product._id,
                name: product.name,
                price: finalPrice,
                quantity: quantity
            });
        }

        // Recalculate subtotal
        let subtotal = 0;
        cart.product.forEach(item => {
            subtotal += item.price * item.quantity;
        });
        cart.subtotal = subtotal;
console.log(cart.subtotal)
        // Save the updated cart
        await cart.save();

        res.redirect('/cart');
    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.updateCartQuantity = async (req, res) => {
    try {
        const productId = req.params.productId;
        const newQuantity = parseInt(req.body.quantity);
        
        // Find the cart item by product ID
        const updatedCartItem = await Cart.findOne({ "product.productId": productId });

        if (!updatedCartItem) {
            return res.status(404).json({ message: `Cart item with product ID ${productId} not found.` });
        }

        // Update the quantity of the matched product
        updatedCartItem.product.forEach(product => {
            if (product.productId.equals(productId)) {
                product.quantity = newQuantity;
            }
        });

        // Recalculate the subtotal
        let subtotal = 0;
        updatedCartItem.product.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        // Update the subtotal field of the cart model
        updatedCartItem.subtotal = subtotal;

        // Save the updated cart item to the database
        await updatedCartItem.save();

        // Respond with success message
        res.status(200).json({ message: "Cart quantity updated successfully.", subtotal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.userId;

        // Remove the product from the cart
        const cart = await Cart.findOneAndUpdate(
            { user: userId },
            { $pull: { product: { productId: productId } } },
            { new: true }
        );

        if (cart) {
            // Recalculate the subtotal after removing the product
            let subtotal = 0;
            cart.product.forEach(product => {
                subtotal += product.price * product.quantity;
            });

            // Update the subtotal in the cart
            cart.subtotal = subtotal;

            // Save the updated cart
            await cart.save();

            res.status(204).end();
        } else {
            res.status(404).json({ message: 'Cart not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


exports.renderCheckout = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const userId = req.userId;
            if (!userId) {
                return res.redirect('/api/user/login');
            }

            const categories = await Category.find({ isDeleted: false });
            const user = await User.findById(userId).populate('coupons');

            // Retrieve user's cart with subtotal
            let usercart = await Cart.findOneAndUpdate(
                { user: userId },
                { $pull: { 'product': { 'productId.stock': 0 } } },
                { new: true }
            ).populate({
                path: 'product.productId',
                populate: [{ path: 'productOffer' }, { path: 'categoryOffer' }]
            });

            // Filter out products with zero stock
            usercart.product = usercart.product.filter(product => product.productId.stock > 0);

            // Map productsInfo from user's cart
            const productsInfo = usercart.product.map(cartItem => ({
                name: cartItem.name,
                price: cartItem.price,
                quantity: cartItem.quantity,
                productId: cartItem.productId
            }));

            // Calculate subtotal considering both productOffer and categoryOffer discounts
            let subtotal = 0;
            productsInfo.forEach(product => {
                let finalPrice = product.price;
                if (product.productId.productOffer && product.productId.productOffer.expiryDate >= new Date()) {
                    const productDiscount = product.productId.productOffer.discount;
                    finalPrice -= productDiscount;
                }
                if (product.productId.categoryOffer && product.productId.categoryOffer.expiryDate >= new Date()) {
                    const categoryDiscount = product.productId.categoryOffer.discount;
                    finalPrice -= (finalPrice * (categoryDiscount / 100));
                }
                subtotal += finalPrice * product.quantity;
            });

            // Retrieve coupon code from query parameters
            const couponCode = req.query.couponCode;
            req.body.couponCode = couponCode;
            if (couponCode) {
                // Find the coupon in the user's coupons array
                const coupon = user.coupons.find(c => c.code === couponCode);
                if (coupon) {
                    // If the coupon is found, calculate the discounted total amount
                    const discountAmount = coupon.discountAmount;
                    subtotal -= discountAmount; // Subtract coupon discount from subtotal
                }
            }

            const address = await Address.find({ user: userId });
            const wallet = await Wallet.findOne({ userId });
            const cartId = usercart._id;
            const availableCoupons = await Coupon.find({});
console.log(usercart)
            // Pass subtotal and other data to the checkout page
            res.render('checkout', {
                user, usercart, subtotal, token, categories, address,
                productsInfo, wallet, couponCode, cartId, availableCoupons
            });
        }
    } catch (error) {
        console.error(error);
        res.render('404page');
    }
};


exports.applyCoupon = async (req, res) => {
    try {
        // Extract coupon code and total amount from the request body
        const { couponCode } = req.body;
        const userId = req.userId;
        
        // Find the coupon by code
        const coupon = await Coupon.findOne({ code: couponCode });

        // Check if the coupon exists and is valid
        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found or invalid' });
        }

        // Check if the coupon is expired
        if (coupon.expiryDate < new Date()) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        // Retrieve user and populate coupons
        const user = await User.findById(userId).populate('coupons');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Retrieve cart for the user
        const cart = await Cart.findOne({ user: userId });

        // Check if the user already has the coupon
        const userCoupon = user.coupons.find(c => c.code === couponCode);
        if (userCoupon) {
            // Redirect to the checkout page with coupon code in queries
            return res.redirect(`/checkout?couponCode=${couponCode}&msg=applied`);
        }

        // Check if the total amount meets the minimum purchase amount criteria
        const originalTotalAmount = cart.subtotal;
        if (originalTotalAmount < coupon.minimumPurchaseAmount) {
            return res.status(400).json({ message: 'Total amount does not meet the minimum purchase requirement for this coupon' });
        }

        // Calculate the discount amount based on the coupon
        const discountAmount = coupon.discountAmount;

        // Apply the discount to the subtotal
        const updatedSubtotal = originalTotalAmount - discountAmount;

        // Check if the updated subtotal is zero or negative
        if (updatedSubtotal <= 0) {
            return res.redirect('/checkout?msg=wrongcoupon')
        }

        // Update the cart's subtotal
        cart.subtotal = updatedSubtotal;

        // Save the updated cart
        await cart.save();

        // Redirect to the checkout page with coupon code in queries
        res.redirect(`/checkout?couponCode=${couponCode}&msg=applied`);
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



