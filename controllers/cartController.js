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
            if (!userId) {
                return res.redirect('/api/user/login');
            }

            // Retrieve user's cart
            const usercart = await Cart.find({ user: userId }).populate('product.productId');

            // Calculate subtotal from the cart database
            const subtotalFromCart = usercart.reduce((total, cartItem) => {
                cartItem.product.forEach(product => {
                    // Check if the product is in stock
                    if (product.productId.stock > 0) {
                        total += product.productId.sellingPrice * product.quantity;
                    }
                });
                return total;
            }, 0);

            // Retrieve available coupons
            const availableCoupons = await Coupon.find({});

            // Pass original subtotal and couponCode to the view
            const originalSubtotal = subtotalFromCart;
            const {couponCode} =req.body; // Initialize couponCode as empty string or retrieve it from somewhere
console.log(couponCode,"carts")
            res.render('cart', { usercart, categories, token, subtotal: subtotalFromCart, availableCoupons, originalSubtotal, couponCode });
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
  
      console.log("User Id : ", userId); 
  
     
      const product = await Product.findById(productId);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      if (quantity > product.stock) {
        return res.status(400).json({ message: 'Insufficient stock available' });
      }
  
      if (product.maxQuantityPerPerson && quantity > product.maxQuantityPerPerson) {
        return res.status(400).json({
          message: `Maximum ${product.maxQuantityPerPerson} quantity allowed per person`
        });
      }
  
   
      let cart = await Cart.findOne({ user: userId });
  
      if (!cart) {
        cart = new Cart({ user: userId, product: [], subtotal: 0 });
      }
  
      
      const existingProductIndex = cart.product.findIndex(item => item.productId.equals(productId));
  
      if (existingProductIndex !== -1) {
        const totalQuantity = cart.product[existingProductIndex].quantity + quantity;
        cart.product[existingProductIndex].quantity = totalQuantity;
      } else {
        cart.product.push({
          productId: product._id,
          name: product.name,
          price: product.sellingPrice, 
          quantity: quantity
        });
      }
  
    
      let subtotal = 0;
      cart.product.forEach(item => {
        subtotal += item.price * item.quantity;
      });
      cart.subtotal = subtotal;
  
     
      await cart.save();
  
      res.redirect('/cart'); // Assuming a redirect to a cart page
    } catch (error) {
      console.error('Error adding product to cart:', error);
      res.status(500).json({ message: 'Internal server error' }); // Generic error message for the user
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
                subtotal += product.productId.sellingPrice * product.quantity;
            });

            // Update the subtotal in the cart to zero if no products are left
            if (cart.product.length === 0) {
                cart.subtotal = 0;
            } else {
                cart.subtotal = subtotal;
            }

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
    const { couponCode } = req.body;
    console.log(couponCode, "checkout")
    try {
        const token = req.cookies.token;
        if (token) {
            const userId = req.userId;
            if (!userId) {
                return res.redirect('/api/user/login');
            }

            const categories = await Category.find({ isDeleted: false });
            const user = await User.findById(userId);

            // Retrieve user's cart with subtotal
            let usercart = await Cart.findOneAndUpdate(
                { user: userId },
                { $pull: { 'product': { 'productId.stock': 0 } } }, // Remove products with zero stock
                { new: true }
            ).populate('product.productId');

            // Get subtotal from user's cart
            const subtotal = usercart.subtotal;

            // Filter out products with zero stock
            usercart.product = usercart.product.filter(product => product.productId.stock > 0);

            // Map productsInfo from user's cart
            const productsInfo = usercart.product.map(cartItem => ({
                name: cartItem.name,
                price: cartItem.price, // Use cartItem.price instead of subtotal
                quantity: cartItem.quantity // Include quantity if needed
            }));

            // Retrieve coupon information
            const coupon = await Coupon.findOne({ code: couponCode });

            let discountedSubtotal = subtotal; // Initialize discountedSubtotal with subtotal

            // Apply coupon discount if applicable
            if (coupon && subtotal >= coupon.minimumPurchaseAmount) {
                discountedSubtotal -= coupon.discountAmount;
            }

            const address = await Address.find({ user: userId });
            const wallet = await Wallet.findOne({ userId });
           
            // Pass discountedSubtotal and productsInfo to the checkout page along with other data
            res.render('checkout', { user, usercart, subtotal, discountedSubtotal, token, categories, address, productsInfo, wallet, couponCode });
        }
    } catch (error) {
        console.error(error);
        res.render('404page');
    }
};

// apply coupon
exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;

        // Find the coupon by code
        const coupon = await Coupon.findOne({ code: couponCode });

        if (!coupon) {
            return res.status(404).send('Coupon not found');
        }

        // Check if the coupon has already been used by the user
        const userId = req.userId;
        const user = await User.findById(userId);

        if (user.couponUsed) {
            return res.redirect('/cart?msg=added')
        }

        // Retrieve the user's cart
        let usercart = await Cart.find({ user: userId }).populate('product.productId');

        if (!usercart || usercart.length === 0) {
            return res.status(404).send('Cart not found');
        }

        let subtotal = 0;

        // Calculate subtotal and apply discount if conditions are met
        usercart.forEach(cartItem => {
            cartItem.product.forEach(product => {
                // Check if the product is in stock
                if (product.productId.stock > 0) {
                    subtotal += product.productId.sellingPrice * product.quantity;
                }
            });

            // Check if the subtotal meets the minimum purchase amount for the coupon
            if (subtotal >= coupon.minimumPurchaseAmount) {
                // Subtract the discount amount from the subtotal
                cartItem.subtotal -= coupon.discountAmount;
            }
        });

        // Save the updated cart items to the database
        await Promise.all(usercart.map(cartItem => cartItem.save()));

        // Mark the coupon as used by the user
        user.couponUsed = true;
        await user.save();

        // Render the cart page with the updated subtotal and couponCode
        const categories = await Category.find({ isDeleted: false });
        const automaticallyAppliedCoupons = [];
        const availableCoupons = await Coupon.find({});
        const originalSubtotal = subtotal;

        res.render('cart', { usercart, categories, token: req.cookies.token, subtotal, automaticallyAppliedCoupons, availableCoupons, originalSubtotal, couponCode });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

