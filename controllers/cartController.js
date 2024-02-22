const Category = require('../models/category'); 
const Product = require('../models/product')
const Cart = require('../models/cart')

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
          const token = req.cookies.token;
          const usercart = await Cart.find({ userId }).populate('product');
   

          console.log(usercart);
          res.render('cart', { usercart, categories,token});
      } 
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  } 
 };
 
 

exports.addToCart = async (req, res) => {
 try {
     const { productId } = req.body;
     const userId = req.userId; 
     let cart = await Cart.findOne({ userId, productId });

     if (cart) {
         cart.quantity += 1;
     } else {
         const product = await Product.findById(productId);
         if (!product) {
             return res.status(404).send('Product not found');
         }
         cart = new Cart({
             userId: userId,
             productId: productId,
             quantity: 1,
             product: product
         });
     }
     await cart.save();

     res.redirect('/cart');   
 } catch (error) {
     console.error(error);
     res.status(500).send('Internal Server Error');
 }
};
