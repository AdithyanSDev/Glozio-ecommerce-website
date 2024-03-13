// detailController.js
const Product = require('../models/product');
const Review = require('../models/review');
const Category = require('../models/category');
const Cart = require('../models/cart');

exports.renderDetailPage = async (req, res) => {
  try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);
      // Fetch reviews for the product
      const reviews = await Review.find({ productId });

      // Fetch reviews count for the product
      const reviewCount = await Review.countDocuments({ productId });
      const token = req.cookies.token;
      const userId = req.userId; 

      // Fetch related products based on the current product's category
      const relatedProducts = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(4);

      // Fetch user's cart
      const usercart = await Cart.find({ user: userId }).populate('product.productId');
      res.render('detail', { product, reviews, reviewCount, relatedProducts, token, usercart});



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

exports.reviewSave= async (req, res) => {
  try {
      const { productId, userId, rating, review } = req.body;
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
}

exports.reviewSubmit = async (req, res) => {
  try {
    const { productId, rating, review } = req.body; // Change 'comment' to 'review'

    // Assuming you have validation for productId, rating, and review
    if (!productId || !rating || !review) { // Change 'comment' to 'review'
      return res.status(400).send("Please provide productId, rating, and review."); // Change 'comment' to 'review'
    }

    // Save the review to the database
    const newReview = await Review.create({
      productId,
      rating,
      review
    });

    // Respond with a success message or redirect the user to a different page
    res.status(200).send("Review submitted successfully!");
  } catch (error) {
    // Handle errors
    console.error("Error submitting review:", error);
    res.render('404page')
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
      const products = await Product.find({ name: { $regex: regex } },{brand:{$regex:regex}});

      // Fetch categories
      const categories = await Category.find({ isDeleted: false });

      // Pass token, categories, products, and query to the searchResults page
      res.render('searchResults', { products, query, token: req.cookies.token, categories });
  } catch (error) {
      console.error(error);
      res.render('404page');
  }
};

