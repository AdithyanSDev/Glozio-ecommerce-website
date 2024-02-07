const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController'); // Import productController

// User management routes
router.post('/adminlogin',adminController.adminLogin)
router.get('/adminhome',adminController.adminhome)
router.get('/usermanagement', adminController.listUsers);
router.post('/blockuser/:userId', adminController.blockUser);
router.post('/unblockuser/:userId', adminController.unblockUser);

// Category routes


// Product routes
router.get('/products', productController.listProducts);
router.get('/products/add', productController.showAddProductForm);
router.post('/products/add', productController.addProduct);
router.get('/products/edit/:productId', productController.showEditProductForm);
router.post('/products/edit/:productId', productController.editProduct);
router.post('/products/delete/:productId', productController.softDeleteProduct);



module.exports = router;
