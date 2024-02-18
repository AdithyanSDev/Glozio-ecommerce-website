const express = require('express');
const router = express.Router();
const { renderHomePage,productsByCategory} = require('../controllers/authController');
const { renderDetailPage, reviewSubmit ,getRelatedProducts } = require('../controllers/detailController'); // Import reviewSubmit function
const Review = require('../models/review');
const Product = require('../models/product');



router.get('/', renderHomePage);
router.get('/detail', (req, res) => {
    res.render('detail'); 
});
router.get('/detail/:productId', renderDetailPage);
router.get('/review/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);
        const reviewCount = await Review.countDocuments({ productId }); // Count total reviews for the product
        res.render('review', { product, reviewCount });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
router.post('/review/:productId', async (req, res) => {
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
        res.status(500).send('Server Error');
    }
});
router.post('/submit-review', reviewSubmit); 
router.get('/category/:categoryId', productsByCategory);
module.exports = router;
