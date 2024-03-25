const express = require('express');
const router = express.Router();
const { renderHomePage,productsByCategory} = require('../controllers/authController');
const { renderDetailPage, reviewSubmit ,getRelatedProducts, reviewCount, reviewSave,searchProducts ,getProductSuggestions} = require('../controllers/detailController'); 
const productController=require("../controllers/productController");
const profileController =require( "../controllers/profileController")
const upload=require('../multer/multerConfig')
const { verifyToken } = require('../middleware/authMiddleware');


router.get('/', renderHomePage);
router.get('/detail', (req, res) => {
    res.render('detail'); 
});
router.get('/detail/:productId',verifyToken, renderDetailPage);
router.get('/review/:productId',reviewCount );
router.post('/review/:productId',verifyToken,reviewSave);
router.post('/submit-review',verifyToken, reviewSubmit); 
router.get('/category/:categoryId',verifyToken, productsByCategory);
router.get('/shop',verifyToken, productController.getAllProducts);
router.get('/filterproducts',verifyToken,productController.filterProducts)
router.get('/sortProducts/:sortId' , productController.getSortedProducts ) ;
router.get('/sortProductsCategory/:categoryId/:sortByValue', productController.getSortProductsCategory);
router.get('/filterproductsbycategory/:categoryId', productController.filterProductsByCategory)
router.get('/offers',verifyToken,productController.productOffer)
router.get('/offer/:id',verifyToken, productController.getOfferDetail);

router.get('/wallet',verifyToken,profileController.walletShow);

router.get('/search',verifyToken, searchProducts);

module.exports = router;
