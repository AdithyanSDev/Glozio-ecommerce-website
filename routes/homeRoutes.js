const express = require('express');
const router = express.Router();
const { renderHomePage,productsByCategory} = require('../controllers/authController');
const { renderDetailPage, reviewSubmit ,getRelatedProducts, reviewCount, reviewSave } = require('../controllers/detailController'); // Import reviewSubmit function
const Review = require('../models/review');
const Product = require('../models/product');
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/', renderHomePage);
router.get('/detail', (req, res) => {
    res.render('detail'); 
});
router.get('/detail/:productId', renderDetailPage);
router.get('/review/:productId',reviewCount );
router.post('/review/:productId',reviewSave);
router.post('/submit-review', reviewSubmit); 
router.get('/category/:categoryId',verifyToken, productsByCategory);
module.exports = router;
