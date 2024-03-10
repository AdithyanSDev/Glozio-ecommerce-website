const Wishlist = require('../models/wishlist');
const User = require('../models/user')
const Category=require('../models/category')
const Product=require('../models/product')
const Cart=require('../models/cart')
const Swal = require('sweetalert2');

// Controller to add a product to the wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;
    
    const existingItem = await Wishlist.findOne({ user: userId, product: productId });

    if (existingItem) {
      return res.redirect(`/detail/${productId}?msg=error`)
    }

    // Create a new wishlist item
    const wishlistItem = new Wishlist({
      user: userId,
      product: productId
    });

    // Save the wishlist item to the database
    await wishlistItem.save();
  

    // Redirect to the detail page with the productId parameter
    res.redirect(`/detail/${productId}?msg=added`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller to remove a product from the wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.userid;
    const productId = req.params.id;
   const wishlist= await Wishlist.findOneAndDelete({ userid: userId, productid: productId })
    res.redirect('/wishlist');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller to get all wishlist items for a user
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.userId; 
    const wishlistItems = await Wishlist.find({ user: userId }).populate('product');
    const user = await User.findById(req.userId );
    const categories = await Category.find({ isDeleted: false }).populate('products'); 
    const token = req.cookies.token;
    res.render('wishlistpage',{wishlistItems,user:user,categories:categories,token})
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.addToCartfromWishlist = async (req, res) => {
  try {
      const productId = req.params.productId;
      const userId = req.userId;

      const product = await Product.findById(productId);

      if (!product) {
          return res.status(404).json({ message: 'Product not found' });
      }

      // Assuming you have quantity handling in your route, you might want to add it here

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
          cart = new Cart({ user: userId, product: [], subtotal: 0 });
      }

      const existingProductIndex = cart.product.findIndex(item => item.productId.equals(productId));

      if (existingProductIndex !== -1) {
          // Handle existing product in cart
      } else {
          if (product.stock > 0) {
              cart.product.push({
                  productId: product._id,
                  name: product.name,
                  price: product.sellingPrice, // Use sellingPrice instead of price
                  quantity: 1, // Assuming you're adding one quantity by default
              });
          } else {
              return res.status(400).json({ message: 'Product out of stock' });
          }
      }

      // Recalculate the subtotal based on the selling price
      let subtotal = 0;
      cart.product.forEach(item => {
          subtotal += item.price * item.quantity;
      });

      // Update the subtotal field of the cart model
      cart.subtotal = subtotal;
      
      await Wishlist.findOneAndDelete({ user: userId, product: productId });

      await cart.save();

      res.redirect('/cart');
  } catch (error) {
      console.error(error);
      res.render('404page');
  }
};