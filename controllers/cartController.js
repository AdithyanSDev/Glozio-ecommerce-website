 const Category = require('../models/category'); 
 const Product = require('../models/product')
 const Cart=require('../models/cart')


 exports.renderCartPage = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            const categories = await Category.find({ isDeleted: false });
            const userId = req.query.userId; // Extract userId from query parameters
            console.log("userId:", userId);
            if (!userId) {
                return res.redirect('/api/user/login'); // Redirect to login if userId is not provided
            }

            
            // Render the cart view with user's cart items, product stocks, and categories
            res.render('cart');
        } else {
            res.redirect('/api/user/login');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    } 
};
exports.addToCart = async (req, res) => {
    try {
      // Extract product ID and user ID from request body
      const { productId } = req.body;
      const userId = req.userId; 
  
      // Fetch product details corresponding to productId
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).send('Product not found');
      }

      // Create a new cart document with product details
      const cart = new Cart({
        userId: userId,
        productId: productId,
        quantity: 1,
        product: product 
      });
      await cart.save();
      res.redirect('/cart'); 
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
};
