const express = require('express');
const router = express.Router();
const { renderHomePage,productsByCategory} = require('../controllers/authController');
const { renderDetailPage, reviewSubmit ,getRelatedProducts, reviewCount, reviewSave } = require('../controllers/detailController'); 
const productController=require("../controllers/productController");
const profileController =require( "../controllers/profileController")
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/', renderHomePage);
router.get('/detail', (req, res) => {
    res.render('detail'); 
});
router.get('/detail/:productId',verifyToken, renderDetailPage);
router.get('/review/:productId',reviewCount );
router.post('/review/:productId',reviewSave);
router.post('/submit-review', reviewSubmit); 
router.get('/category/:categoryId',verifyToken, productsByCategory);
router.get('/shop',verifyToken, productController.getAllProducts);

router.get('/sortProducts/:sortId' , productController.getSortedProducts ) ;
router.get('/sortProductsCategory/:categoryId/:sortByValue', productController.getSortProductsCategory);


router.get('/wallet',verifyToken,profileController.walletShow);

module.exports = router;
