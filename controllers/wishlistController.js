const Wishlist = require('../models/wishlist');
const User = require('../models/user')
const Category=require('../models/category')
const Swal = require('sweetalert2');

// Controller to add a product to the wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;
    
    const existingItem = await Wishlist.findOne({ user: userId, product: productId });

    if (existingItem) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    // Create a new wishlist item
    const wishlistItem = new Wishlist({
      user: userId,
      product: productId
    });

    // Save the wishlist item to the database
    await wishlistItem.save();

    // SweetAlert integration
    Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Product added to wishlist",
      showConfirmButton: false,
      timer: 1500
    });

    // Redirect to the detail page with the productId parameter
    res.redirect(`/detail/${productId}`);
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
