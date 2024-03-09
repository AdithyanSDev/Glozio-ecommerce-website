const Product = require('../models/product');
const Category = require('../models/category');
const Review = require('../models/product')
const User=require('../models/user')
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
    const { name, description, price, sellingPrice, category, stock, highlights, brand } = req.body;

    // Convert price and sellingPrice to numbers
    const numericPrice = parseFloat(price);
    const numericSellingPrice = parseFloat(sellingPrice);

    // Calculate discount based on price and sellingPrice
    const discount = numericPrice > 0 ? ((numericPrice - numericSellingPrice) / numericPrice) * 100 : 0;

    // Log the received files
    console.log('Received files:', req.files);

    // Ensure images are uploaded
    if (!req.files || req.files.length === 0) {
      throw new Error('No images uploaded');
    }

    // Map uploaded files to their paths
    const images = req.files.map(file => file.path);

    // Create a new product instance with the provided data
    const newProduct = new Product({
      name,
      description,
      price: numericPrice,
      sellingPrice: numericSellingPrice,
      discount, // Store dynamically calculated discount
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

      // Check if there are other products with the same name excluding the current product
      const existingProduct = await Product.findOne({ name: updates.name, _id: { $ne: productId } });
      if (existingProduct) {
          return res.status(400).send('Another product with the same name already exists');
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
      if (req.files && req.files.length > 0) { // Check if files are uploaded
          // Clear existing images array
          product.images = [];

          req.files.forEach((file) => {
              const newImage = file.path;
              product.images.push(newImage);
          });
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

exports.getSortedProducts = async (req, res) => {
  const { categoryId } = req.params;
    const  sortBy  = req.params.sortId;
  
console.log(sortBy);

  try {
      let sortedProducts;
      const categories = await Category.find();
      const user = await User.findOne({ email: req.session.email });

      switch (sortBy) {
          case 'popularity':
              sortedProducts = await Product.find().sort({_id:1});
              break;
          case 'price-low-to-high':
              sortedProducts = await Product.find().sort({ sellingPrice: 1 });
              break;
          case 'price-high-to-low':
              sortedProducts = await Product.find().sort({ sellingPrice: -1 });
              break;
          case 'a-to-z':
              sortedProducts = await Product.find().sort({ name: 1 });
              break;
          case 'z-to-a':
              sortedProducts = await Product.find().sort({ name: -1 });
              break;
          case 'newest-first':
              sortedProducts = await Product.find().sort({ _id: -1 });
              break;
          default:
              sortedProducts = await Product.find();
      }
console.log(sortedProducts)
      res.json(sortedProducts);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error'});
}
};

exports.getAllProducts = async (req, res) => {
  try {
      const products = await Product.find({ isDeleted: false });
      // Fetch review counts for each product
      const productReviewCounts = await Promise.all(products.map(async product => {
          const reviewCount = await Review.countDocuments({ productId: product._id });
          return { productId: product._id, reviewCount };
      }));

      // Create a map of product IDs to review counts for easy access
      const reviewCountMap = productReviewCounts.reduce((map, obj) => {
          map[obj.productId] = obj.reviewCount;
          return map;
      }, {});

      // Pass the reviewCountMap to the template
      res.render('shop', { products, reviewCountMap }); // Include reviewCountMap here
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
}
// Get sorted products by category
exports.getSortProductsCategory = async (req, res) => {
  const categoryId = req.params.categoryId;
  const sortBy = req.params.sortByValue;

  console.log(categoryId);
  console.log(sortBy);

  try {
    let sortedProducts;
    switch (sortBy) {
      case 'popularity':
        sortedProducts = await Product.find({ category: categoryId }).sort({ _id: 1 });
        break;
      case 'price-low-to-high':
        sortedProducts = await Product.find({ category: categoryId }).sort({ sellingPrice: 1 });
        break;
      case 'price-high-to-low':
        sortedProducts = await Product.find({ category: categoryId }).sort({ sellingPrice: -1 });
        break;
      case 'a-to-z':
        sortedProducts = await Product.find({ category: categoryId }).sort({ name: 1 });
        break;
      case 'z-to-a':
        sortedProducts = await Product.find({ category: categoryId }).sort({ name: -1 });
        break;
      case 'newest-first':
        sortedProducts = await Product.find({ category: categoryId }).sort({ _id: -1 });
        break;
      default:
        sortedProducts = await Product.find({ category: categoryId });
    }
    console.log(sortedProducts);
    res.json(sortedProducts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
