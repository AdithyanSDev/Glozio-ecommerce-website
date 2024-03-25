// detailController.js
const Product = require('../models/product');
const Review = require('../models/review');
const Category = require('../models/category');
const Cart = require('../models/cart');
const Order=require('../models/order')

exports.renderDetailPage = async (req, res) => {
  try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);
      const userId = req.userId;
      const token = req.cookies.token;
      // Fetch user's orders to check if the product has been ordered by the user
      const userOrders = await Order.find({ userId });
      const orderedProductIds = userOrders.flatMap(order => order.orderedItems.map(item => item.productId));

      // Check if the current product has been ordered by the user
      const hasOrdered = orderedProductIds.includes(productId);

      // Fetch reviews for the product
      const reviews = await Review.find({ productId });

      // Fetch reviews count for the product
      const reviewCount = await Review.countDocuments({ productId });

      // Fetch related products based on the current product's category
      const relatedProducts = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(4);
      const usercart = await Cart.find({ user: userId }).populate('product.productId');
      // Pass the hasOrdered flag to the template
      res.render('detail', { product, reviews, reviewCount, relatedProducts, hasOrdered,token,usercart });
  } catch (error) {
      console.error(error);
      res.render('404page');
  }
};





exports.reviewCount=async (req, res) => {
  try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);
      const reviewCount = await Review.countDocuments({ productId }); // Count total reviews for the product
      res.render('review', { product, reviewCount });
  } catch (error) {
      console.error(error);
      res.render('404page')
  }
}

exports.reviewSave = async (req, res) => {
  try {
      const { productId, userId, rating, review } = req.body;

      // Check if the user has ordered the product
      const userOrder = await Order.findOne({ userId, "orderedItems.productId": productId });

      if (!userOrder) {
          return res.status(400).send("You can only review products you have ordered.");
      }

      // Save the review to the database
      const newReview = new Review({
          productId,
          userId,
          rating,
          review
      });
      await newReview.save();
      res.redirect(`/review/${productId}`);
  } catch (error) {
      console.error(error);
      res.render('404page')
  }
};
exports.reviewSubmit = async (req, res) => {
  try {
   
    const userId = req.userId;
console.log(userId,'userid')
    // Extract other fields from the request body
    const { rating, review ,productId} = req.body;
console.log(req.body)
    // Check if the required fields are provided
    if (!productId || !userId || !rating || !review) {
      return res.status(400).send("Please provide productId, userId, rating, and review.");
    }

    // Save the review to the database
    const newReview = await Review.create({
      productId,
      userId,
      rating,
      review
    });

    // Respond with a success message or redirect the user to a different page
    res.redirect(`/detail/${productId}`)
  } catch (error) {
    // Handle errors
    console.error("Error submitting review:", error);
    res.render('404page');
  }
};





exports.getRelatedProducts = async (req, res) => {
  try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);
      const relatedProducts = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(5); 

      res.render('detail', { relatedProducts });
  } catch (error) {
      console.error(error);
      res.render('404page')
  }
};


exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.q;
    const regex = new RegExp(query, 'i');
    
    // Fetch non-blocked categories
    const categories = await Category.find({ isDeleted: false });

    // Find products from non-blocked categories that match the search query
    const products = await Product.find({
      $or: [
        { name: { $regex: regex } },
        { brand: { $regex: regex } }
      ],
      category: { $in: categories.filter(category => !category.isBlocked).map(category => category._id) }
    });

    // Pass token, categories, products, and query to the searchResults page
    res.render('searchResults', { products, query, token: req.cookies.token, categories });
  } catch (error) {
    console.error(error);
    res.render('404page');
  }
};
