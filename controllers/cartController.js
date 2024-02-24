const Category = require('../models/category'); 
const Product = require('../models/product')
const Cart = require('../models/cart')
const User = require('../models/user')
const Address=require('../models/address')
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
        console.log(usercart);
        res.render('cart', { usercart, categories, token ,subtotal});
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  
 
 

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

        const maxQuantityPerPerson = 5;
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, product: [] });
        }

        const existingProductIndex = cart.product.findIndex(item => item.productId.equals(productId));

        if (existingProductIndex !== -1) {
            const totalQuantity = cart.product[existingProductIndex].quantity + quantity;

            if (totalQuantity > maxQuantityPerPerson) {
                return res.status(400).json({ message: `Maximum ${maxQuantityPerPerson} quantity allowed per person` });
            }

            cart.product[existingProductIndex].quantity += quantity || 1;
        } else {
            cart.product.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: quantity || 1,
            });
        }

        await cart.save();
        console.log(cart)
        res.redirect('/cart')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

exports.increaseQuantity = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.userId;
        
        let cart = await Cart.findOne({ user: userId });

        if (cart) {
            const cartItem = cart.product.find(item => item.productId.equals(productId));
            if (cartItem) {
                cartItem.quantity += 1;
                await cart.save();
                res.status(200).json({ message: 'Quantity increased successfully', cart });
            } else {
                res.status(404).json({ message: 'Cart item not found' });
            }
        } else {
            res.status(404).json({ message: 'Cart not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
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


//checkout
exports.renderCheckout = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const userId = req.userId;
            if (!userId) {
                return res.redirect('/api/user/login');
            }
            const categories = await Category.find({ isDeleted: false });
            const user = await User.findById(userId); // Assuming you have a User model
            const usercart = await Cart.find({ user: userId }).populate('product.productId');
            let subtotal = 0;

            // Calculate subtotal
            usercart.forEach(cartItem => {
                cartItem.product.forEach(product => {
                    subtotal += product.productId.sellingPrice * product.quantity;
                });
            });
            const addresses = await Address.find({ user: userId });

            res.render('checkout', { user, usercart, subtotal,token,categories,addresses });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};
