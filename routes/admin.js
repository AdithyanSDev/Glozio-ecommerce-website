const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController'); 
const categoryController=require('../controllers/categoryController');
const upload=require('../multer/multerConfig')
const { isAdmin } = require('../middleware/authMiddleware');



// User management routes
router.post('/adminlogin',adminController.adminLogin)
router.get('/adminhome',isAdmin,adminController.adminhome)
router.get('/usermanagement',isAdmin, adminController.listUsers);
router.post('/blockuser/:userId', adminController.blockUser);
router.post('/unblockuser/:userId', adminController.unblockUser);
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
router.delete('/admin/products/:productId/delete-image/:imageIndex',isAdmin,productController.deleteImage)
router.post('/products/:productId/delete', productController.deleteProduct);


module.exports = router;
