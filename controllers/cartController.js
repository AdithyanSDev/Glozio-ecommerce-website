const Category = require('../models/category'); 
const Product = require('../models/product')
const Cart = require('../models/cart')
const User = require('../models/user')
const Address=require('../models/address')
const Wallet=require('../models/wallet')
const Coupon =require('../models/coupon')



exports.renderCartPage = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const categories = await Category.find({ isDeleted: false });
            const userId = req.userId;
            console.log("userId:", userId);
            if (!userId) {
                return res.redirect('/api/user/login');
            }

            // Retrieve user's cart
            const usercart = await Cart.find({ user: userId }).populate('product.productId');

            // Calculate subtotal
            let subtotal = 0;
            usercart.forEach(cartItem => {
                cartItem.product.forEach(product => {
                    // Check if the product is in stock
                    if (product.productId.stock > 0) {
                        subtotal += product.productId.sellingPrice * product.quantity;
                    }
                });
            });

            // Retrieve available coupons
            const availableCoupons = await Coupon.find({});

            // Check if any coupon should be automatically applied
            const automaticallyAppliedCoupons = availableCoupons.filter(coupon => subtotal >= coupon.minimumPurchaseAmount);

            // Calculate discountedSubtotal
            let discountedSubtotal = subtotal;
            if (req.session.discountedSubtotal) {
                discountedSubtotal = req.session.discountedSubtotal;
                delete req.session.discountedSubtotal;
            }

            // Pass original subtotal to the view
            const originalSubtotal = subtotal;

            console.log(usercart);
            res.render('cart', { usercart, categories, token: req.cookies.token, subtotal: discountedSubtotal, automaticallyAppliedCoupons, availableCoupons, originalSubtotal });

        }
    } catch (error) {
        console.error(error);
        res.render('404page');
    }
};


 
 
// addToCart controller
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.userId;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (quantity > product.stock) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, product: [], subtotal: 0 });
        }

        const existingProductIndex = cart.product.findIndex(item => item.productId.equals(productId));

        if (existingProductIndex !== -1) {
            const totalQuantity = cart.product[existingProductIndex].quantity + quantity;

            if (totalQuantity > product.maxQuantityPerPerson) {
                return res.status(400).json({ message: `Maximum ${product.maxQuantityPerPerson} quantity allowed per person` });
            }

            cart.product[existingProductIndex].quantity += quantity || 1;
        } else {
            if (product.stock > 0) {
                cart.product.push({
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: quantity || 1,
                });
            } else {
                return res.status(400).json({ message: 'Product out of stock' });
            }
        }

        // Recalculate the subtotal
        let subtotal = 0;
        cart.product.forEach(item => {
            // Check if price or quantity is not a valid number
            if (typeof item.price !== 'number' || Number(item.price) ||
                typeof item.quantity !== 'number' || Number(item.quantity)) {
                console.error('Invalid price or quantity:', item);
                return;
            }
        
            subtotal += item.price * item.quantity;
        });
        console.log(subtotal, "subtotal");
        console.log(typeof(subtotal));
        await cart.save();

        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.render('404page');
    }
};



exports.updateCartQuantity = async (req, res) => {
    
    try {
        const productId = req.params.productId;
        const newQuantity = parseInt(req.body.quantity);
        
       
        // Update the quantity of the specified product in the cart
        const updatedCart = await Cart.findOneAndUpdate(
            { "product.productId": productId }, // Find the cart item by product ID
            { $set: { "product.$.quantity": newQuantity } }, // Update the quantity of the matched product
            { new: true }
        );
        console.log("usgda ")
        if (!updatedCart) {
            return res.status(404).json({ message: `Cart item with product ID ${productId} not found.` });
        }

        // Respond with success message
        res.status(200).json({ message: "Cart quantity updated successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.userId;

        const cart = await Cart.findOneAndUpdate(
            { user: userId },
            { $pull: { product: { productId: productId } } },
            { new: true }
        );

        if (cart) {
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
    const { couponCode } = req.body;
    try {
        const token = req.cookies.token;
        if (token) {
            const userId = req.userId;
            if (!userId) {
                return res.redirect('/api/user/login');
            }
            
            const categories = await Category.find({ isDeleted: false });
            const user = await User.findById(userId);
            let usercart = await Cart.findOneAndUpdate(
                { user: userId },
                { $pull: { 'product': { 'productId.stock': 0 } } }, // Remove products with zero stock
                { new: true }
            ).populate('product.productId');
            
            let subtotal = 0;

            // Calculate subtotal
            usercart.product.forEach(product => {
                subtotal += product.productId.sellingPrice * product.quantity;
            });

            // Filter out products with zero stock
            usercart.product = usercart.product.filter(product => product.productId.stock > 0);

            const productsInfo = usercart.product.map(cartItem => ({
                name: cartItem.name,
                price: subtotal
            }));
            
            // Retrieve coupon information
            const coupon = await Coupon.findOne({ code:couponCode });

            let discountedSubtotal = subtotal; // Initialize discountedSubtotal with subtotal
            
            // Apply coupon discount if applicable
            if (coupon && subtotal >= coupon.minimumPurchaseAmount) {
                discountedSubtotal -= coupon.discountAmount;
            }

            const address = await Address.find({ user: userId });
            const wallet = await Wallet.findOne({ userId });

            // Pass discountedSubtotal to the checkout page
            res.render('checkout', { user, usercart, subtotal, discountedSubtotal, token, categories, address, productsInfo, wallet });
        }
    } catch (error) {
        console.error(error);
        res.render('404page');
    }
};



//apply coupon
exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        console.log(couponCode);

        const coupon = await Coupon.findOne({ code: couponCode });
        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        const userId = req.userId; 
        const usercart = await Cart.find({ user: userId }).populate('product.productId');

        if (!usercart || usercart.length === 0) {
            return res.status(404).send('Cart not found');
        }

        let subtotal = 0;
        usercart.forEach(cartItem => {
            cartItem.product.forEach(product => {
                // Check if the product is in stock
                if (product.productId.stock > 0) {
                    subtotal += product.productId.sellingPrice * product.quantity;
                }
            });
        });

       
        let discountedSubtotal = subtotal;
        if (subtotal >= coupon.minimumPurchaseAmount) {
            discountedSubtotal -= coupon.discountAmount;
        }

        
        const categories = await Category.find({ isDeleted: false });
        const automaticallyAppliedCoupons = [];
        const availableCoupons = await Coupon.find({});
        const originalSubtotal = subtotal;

      
        res.render('cart', { usercart, categories, token: req.cookies.token, subtotal: discountedSubtotal, automaticallyAppliedCoupons, availableCoupons, originalSubtotal });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

