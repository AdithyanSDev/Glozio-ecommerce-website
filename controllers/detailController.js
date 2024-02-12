// detailController.js

const Product = require('../models/product');
const Review = require('../models/review');
const Category = require('../models/category');

exports.renderDetailPage = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    
    // Fetch reviews for the product
    const reviews = await Review.find({ productId });

    // Fetch reviews count for the product
    const reviewCount = await Review.countDocuments({ productId });

      // Fetch related products based on the current product's category
      const relatedProducts = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(5);

    // Render the detail page and pass the product object, reviews, and reviewCount
    res.render('detail', { product, reviews, reviewCount,relatedProducts });

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


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
    res.status(500).send("Internal Server Error");
  }
};

exports.getRelatedProducts = async (req, res) => {
  try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);
      const relatedProducts = await Product.find({ category: product.category, _id: { $ne: productId } }).limit(5); // Fetch related products based on category excluding the chosen product

      res.render('relatedProducts', { relatedProducts });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};


