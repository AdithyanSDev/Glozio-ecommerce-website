const Product = require('../models/product');
const Category = require('../models/category');
const fs = require('fs');
const path = require('path');

// Function to list all products
exports.listProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).populate('category');
    products.forEach(product => {
      if (!product.category) {
        console.log('Product without category:', product);
      }
    });
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
    const { name, description, price, discount, category, stock, highlights, brand } = req.body;

    // Log the received files
    console.log('Received files:', req.files);

    // Ensure images are uploaded
    if (!req.files || req.files.length === 0) {
      throw new Error('No images uploaded');
    }

    // Map uploaded files to their paths
    const images = req.files.map(file => file.path);

    // Calculate selling price based on the provided discount
    const sellingPrice = price * (1 - discount / 100);

    // Create a new product instance with the provided data
    const newProduct = new Product({
      name,
      description,
      price,
      discount,
      sellingPrice, // Store selling price in the database
      category,
      stock,
      highlights,
      images: images, // Store paths of uploaded images
      brand, // Include the brand field
    });

    // Save the new product to the database
    await newProduct.save();

    // Find the category by its ID and update its products array
    await Category.findByIdAndUpdate(category, { $push: { products: newProduct._id } });

    // Redirect to the products page after successful addition
    res.redirect('/admin/products');
  } catch (error) {
    // Handle errors
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product: ' + error.message);
  }
}


  // Function to show the edit product form
  exports.showEditProductForm = async (req, res) => {
    const productId = req.params.productId;
    try {
      const product = await Product.findById(productId);
      const categories = await Category.find(); // Assuming you have a Category model
      res.render('product/editproduct', { product, categories }); // Pass categories data to the template
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };


// editProduct controller method

exports.editProduct = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const updates = req.body;
    const product = await Product.findById(productId); // Fetch the product
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Handle image deletion
    if (req.query.index) {
      const index = parseInt(req.query.index);
      const imagePath = path.join(__dirname, '../uploads/', product.images[index]); // Use the absolute path of the image
      if (imagePath) {
        // Remove the image from the file system
        fs.unlink(imagePath, (err) => {
          if (err) console.error(err);
        });

        // Remove the image from the images array
        product.images.splice(index, 1);
      }
    }

    // Handle individual image upload
    if (req.file) {
      const newImage = req.file.path;
      product.images.push(newImage);
    }

    // Update the product with the new data
    await Product.findByIdAndUpdate(productId, updates);
    res.redirect('/admin/products');
  } catch (error) {
    next(error);
  }
};

exports.deleteImage=async(req,res)=>{
  const { productId, imageIndex } = req.params;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }
    product.images.splice(imageIndex, 1);
    await product.save();

    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

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
