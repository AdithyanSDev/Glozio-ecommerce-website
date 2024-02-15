const Product = require('../models/product');
const Category = require('../models/category');



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
    const { name, description, price, discount_price, category, stock, highlights } = req.body;
    let images = req.files.map(file => file.path);

    if (!images || images.length === 0) {
      throw new Error('No images uploaded');
    }

    const newProduct = new Product({
      name,
      description,
      price,
      discount: discount_price,
      category,
      stock,
      highlights,
      images: images,
    });

    await newProduct.save();

    // Find the category by its ID and update its products array
    await Category.findByIdAndUpdate(category, { $push: { products: newProduct._id } });

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
    res.render('product/editproduct', { product }); 
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


// Edit product
exports.editProduct = async (req, res, next) => {
  try {
      const productId = req.params.productId;
      const updates = req.body;
      const product = await Product.findById(productId); // Fetch the product
      if (!product) {
          return res.status(404).send('Product not found');
      }
      if (req.files) {
          // Handle new images
          const newImages = req.files.map(file => file.path);
          product.images.forEach(imagePath => {
              // Remove the image from file system (you need to implement this part)
              fs.unlink(imagePath, (err) => {
                  if (err) console.error(err);
              });
          });
          updates.images = newImages;
      }
      await Product.findByIdAndUpdate(productId, updates);
      res.redirect('/admin/products');
  } catch (error) {
      next(error);
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
