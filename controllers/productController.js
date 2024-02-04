const Product = require('../models/product');

// Function to list all products
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false });
    res.render('productmanagement', { products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Function to show the add product form
exports.showAddProductForm = (req, res) => {
  res.render('addproduct');
};

// Function to add a new product
exports.addProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;
    const newProduct = new Product({
      name,
      description,
      price,
    });
    await newProduct.save();
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

// Function to show the edit product form
exports.showEditProductForm = async (req, res) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    res.render('editproduct', { product });
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

// Function to soft delete a product
exports.softDeleteProduct = async (req, res) => {
  const productId = req.params.productId;
  try {
    await Product.findByIdAndUpdate(productId, { isDeleted: true });
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
