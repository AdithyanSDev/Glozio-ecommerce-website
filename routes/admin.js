const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController'); // Import productController

// User management routes
router.get('/usermanagement', adminController.listUsers);
router.post('/blockuser/:userId', adminController.blockUser);
router.post('/unblockuser/:userId', adminController.unblockUser);

// Category routes
// (Assuming you have already implemented category routes)

// Product routes
router.get('/products', productController.listProducts);
router.get('/products/add', productController.showAddProductForm);
router.post('/products/add', productController.addProduct);
router.get('/products/edit/:productId', productController.showEditProductForm);
router.post('/products/edit/:productId', productController.editProduct);
router.post('/products/delete/:productId', productController.softDeleteProduct);

// Your existing routes
// router.get('/salesreport', adminController.salesReport);
// router.get('/adminHome', adminController.adminHome);
// router.get('/productlist', adminController.productList);
// router.get('/category', adminController.category);
// router.get('/viewcoupen', adminController.viewCoupen);
// router.get('/userorders', adminController.userOrders);
// router.get('/productoffers', adminController.productOffers);
// router.get('/logout', adminController.logout);

module.exports = router;
