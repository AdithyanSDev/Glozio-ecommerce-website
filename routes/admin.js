const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const productController = require('../controllers/productController'); 
const categoryController=require('../controllers/categoryController');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
  });
  
  const upload = multer({ storage: storage });

// User management routes
router.post('/adminlogin',adminController.adminLogin)
router.get('/adminhome',adminController.adminhome)
router.get('/usermanagement', adminController.listUsers);
router.post('/blockuser/:userId', adminController.blockUser);
router.post('/unblockuser/:userId', adminController.unblockUser);
router.get('/adminlogout',adminController.adminlogout)

// Category routes
router.get('/categories', categoryController.listCategories); 
router.get('/categories/add', categoryController.showAddCategoryForm); 
router.post('/categories/add', categoryController.addCategory); 
router.get('/categories/:categoryId/products', categoryController.listProductsByCategory); 
router.get('/categories/:categoryId/edit', categoryController.editCategory);
router.post('/categories/:categoryId/edit', categoryController.updateCategory);
router.post('/categories/:categoryId/delete', categoryController.softDeleteCategory);




// Product routes
router.get('/products', productController.listProducts);
router.get('/products/add', productController.showAddProductForm);
router.post('/products/add', upload.array('images', 3), productController.addProduct);
router.get('/products/:productId/edit', productController.showEditProductForm);
router.post('/products/:productId/edit', upload.array('new_images', 3), productController.editProduct);

router.post('/products/:productId/delete', productController.deleteProduct);


module.exports = router;
