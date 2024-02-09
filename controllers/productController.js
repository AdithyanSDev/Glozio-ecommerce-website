const Product = require('../models/product');
const Category = require('../models/category');
const multer = require('multer')
const sharp = require('sharp');

// Multer configuration for file upload
const upload = multer({
  limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
  fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
          cb(null, true);
      } else {
          cb(new Error('Only images are allowed'));
      }
  },
});



// Function to list all products
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });
    res.render('product/productmanagement', { products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.showAddProductForm = async (req, res) => {
  try {
    const categories = await Category.find(); // Assuming you have a Category model
    res.render('product/addproduct', { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, discount_price } = req.body; // Extract discount_price from request body
    const images = req.files.map(file => file.path);

    if (!images || images.length === 0) {
      throw new Error('No images uploaded');
    }

    const newProduct = new Product({
      name,
      description,
      price,
      discount: discount_price, // Assign discount_price to discount field
      images: images,
    });

    await newProduct.save();
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product: ' + error.message);
  }
};


// Function to show the edit product form
exports.showEditProductForm = async (req, res) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    res.render('product/editproduct', { product }); // Assuming your editproduct.ejs is located in the "product" folder
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Function to edit an existing product
exports.editProduct = async (req, res) => {
  const productId = req.params.productId;
  try {
    const { name, description, price } = req.body;
    await Product.findByIdAndUpdate(productId, { name, description, price });
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Function to delete a product
exports.deleteProduct = async (req, res) => {
  const productId = req.params.productId;
  try {
    await Product.findByIdAndDelete(productId);
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
