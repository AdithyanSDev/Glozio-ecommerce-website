const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController'); 
const categoryController=require('../controllers/categoryController');
const ordercontroller = require('../controllers/orderController')
const couponController =require( '../controllers/couponController' )
const salesController =require('../controllers/salesController')
const offerController =require('../controllers/offerController')
const upload=require('../multer/multerConfig')
const uploadbanner = require('../multer/bannerMulter')
const { isAdmin } = require('../middleware/authMiddleware');



// User management routes
router.post('/adminlogin',adminController.adminLogin)
router.get('/adminhome',isAdmin,adminController.adminhome)
router.get('/usermanagement',isAdmin, adminController.listUsers);
router.get('/userstatus/:id',isAdmin,adminController.userstatus);
router.get('/adminlogout',adminController.adminlogout)

// Category routes
router.get('/categories',isAdmin, categoryController.listCategories); 
router.get('/categories/add',isAdmin, categoryController.showAddCategoryForm); 
router.post('/categories/add',isAdmin, categoryController.addCategory); 
router.get('/categories/:categoryId/products',isAdmin, categoryController.listProductsByCategory); 
router.get('/categories/:categoryId/edit',isAdmin, categoryController.editCategory);
router.post('/categories/:categoryId/edit',isAdmin, categoryController.updateCategory);
router.post('/categories/:categoryId/delete', categoryController.softDeleteCategory);




// Product routes
router.get('/products', isAdmin,productController.listProducts);
router.get('/products/add',isAdmin, productController.showAddProductForm);
router.post('/products/add',isAdmin, upload, productController.addProduct);
router.get('/products/:productId/edit',isAdmin, productController.showEditProductForm);
router.post('/products/:productId/edit',isAdmin, upload, productController.editProduct);
router.delete('/deleteimage/:productId/:index', productController.imagedelete);
router.post('/products/:productId/delete', productController.deleteProduct);


//order routes
router.get('/orders',isAdmin,ordercontroller.adminOrders)
router.put('/orders/:orderId/status', isAdmin, ordercontroller.updateOrderStatus);


//coupon routes
router.get('/coupon',isAdmin,couponController.renderCoupon)
router.get('/addcoupon',isAdmin,couponController.renderAddcoupon)
router.post('/createcoupon',isAdmin,couponController.createCoupon)
router.post('/deletecoupon',isAdmin, couponController.removeCoupon)

//sales routes
router.get('/salesreport',isAdmin,salesController.renderSalesreport)
router.get('/generateReport', salesController.generateReport);

//offer routes
router.get('/offer',isAdmin,offerController.renderOffer)
router.get('/addofferpage',isAdmin,offerController.renderAddoffer)
router.post('/addoffer', isAdmin,uploadbanner, offerController.createOffer);
router.get('/offers/:id/edit',isAdmin, offerController.editOffer);
router.post('/edit/:id',isAdmin,uploadbanner,offerController.editofferpost);
router.post('/offers/:id/delete',isAdmin ,offerController.deleteOffer);
router.delete('/deleteofferimage/:offerId/:index',offerController.offerimagedelete);


router.get('/sales/daily', salesController.getDailySalesData);
router.get('/sales/monthly', salesController.getMonthlySalesData);
router.get('/sales/yearly', salesController.getYearlySalesData);

module.exports = router;
