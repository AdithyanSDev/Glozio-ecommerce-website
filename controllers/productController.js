const Product = require('../models/product');
const Category = require('../models/category');
const Review = require('../models/product')
const User=require('../models/user')
const Offer=require('../models/offer')
const ProductOffer = require('../models/productoffer');
const CategoryOffer = require('../models/categoryoffer');
const fs = require('fs');
const path = require('path');
const { image } = require('pdfkit');

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

    // Check if there is an active category offer for the category of the new product
    const activeOffer = await CategoryOffer.findOne({ category: category, expiryDate: { $gte: new Date() } });

    // If an offer exists, associate the new product with that offer
    if (activeOffer) {
      // Update the new product with the category offer
      await Product.findByIdAndUpdate(newProduct._id, { categoryOffer: activeOffer._id });
    }

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


  
  exports.editProduct = async (req, res, next) => {
    try {
      const productId = req.params.productId;
      const updates = req.body;
      const images = req.files;
      const product = await Product.findById(productId); // Fetch the product
      if (!product) {
        return res.status(404).send('Product not found');
      }
  
      // Check if there are other products with the same name excluding the current product
      const existingProduct = await Product.findOne({ name: updates.name, _id: { $ne: productId } });
      if (existingProduct) {
        return res.status(400).send('Another product with the same name already exists');
      }
  
      // Calculate discount
      const numericPrice = parseFloat(updates.price || product.price);
      const numericSellingPrice = parseFloat(updates.sellingPrice || product.sellingPrice);
      const discount = numericPrice > 0 ? ((numericPrice - numericSellingPrice) / numericPrice) * 100 : 0;
      updates.discount = discount;
  
      // Handle category change
      if (updates.category !== product.category.toString()) {
        // Remove the product from the old category
        await Category.updateOne(
          { _id: product.category },
          { $pull: { products: productId } }
        );
  
        // Add the product to the new category
        await Category.updateOne(
          { _id: updates.category },
          { $addToSet: { products: productId } }
        );
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
      if (images && images.length > 0) {
        updates.images = product.images.concat(images.map(image => image.path));
      }
  
      // Update the product with the new data
      await Product.findByIdAndUpdate(productId, updates);
      res.redirect('/admin/products');
    } catch (error) {
      next(error);
    }
  };
  
  

// Controller logic
exports.imagedelete = async (req, res) => {
  try {
      console.log("Entering image deletion controller");
      const productId = req.params.productId;
      const index = req.params.index;
      console.log("Index:", index);

      let product = await Product.findById(productId);
      console.log("Product:", product);

      if (!product) {
          return res.status(404).json({ message: "Product not found" });
      }

      if (index < 0 || index >= product.images.length) {
          return res.status(400).json({ message: "Invalid image index" });
      }

      product.images.splice(index, 1);
      await product.save();

      res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
};


// Function to delete a product
exports.deleteProduct = async (req, res) => {
  const productId = req.params.productId;
  try {
    // Find the product to be deleted
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Delete the product
    await Product.findByIdAndDelete(productId);

    // Remove the product from the associated category
    await Category.updateOne(
      { _id: product.category },
      { $pull: { products: productId } }
    );

    // Redirect with success message
    res.redirect('/admin/products?msg=del');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.getSortedProducts = async (req, res) => {
  const { categoryId } = req.params;
  const sortBy = req.params.sortId;

  try {
      let sortedProducts;
      const categories = await Category.find();
      const user = await User.findOne({ email: req.session.email });

      switch (sortBy) {
          case 'popularity':
              sortedProducts = await Product.find().sort({ _id: 1 }).populate('category');
              break;
          case 'price-low-to-high':
              sortedProducts = await Product.find().sort({ sellingPrice: 1 }).populate('category');
              break;
          case 'price-high-to-low':
              sortedProducts = await Product.find().sort({ sellingPrice: -1 }).populate('category');
              break;
          case 'a-to-z':
              sortedProducts = await Product.find().sort({ name: 1 }).populate('category');
              break;
          case 'z-to-a':
              sortedProducts = await Product.find().sort({ name: -1 }).populate('category');
              break;
          case 'newest-first':
              sortedProducts = await Product.find().sort({ _id: -1 }).populate('category');
              break;
          default:
              sortedProducts = await Product.find().populate('category');
      }

      // Filter out products belonging to blocked categories
      sortedProducts = sortedProducts.filter(product => !product.category.isBlocked);

      res.json(sortedProducts);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getAllProducts = async (req, res) => {
  try {
      const products = await Product.find({ isDeleted: false }).populate('category');
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



exports.productOffer = async (req, res) => {
  try {
      const productOffers = await ProductOffer.find();
      const categoryOffers = await CategoryOffer.find();
      const categories = await Category.find({ isDeleted: false }).populate('products');
      const token = req.cookies.token;
      res.render('offer', { productOffers, categoryOffers, categories, token });
  } catch (error) {
      console.error(error);
  }
};



exports.getOfferDetail = async (req, res) => {
  try {
      const offerId = req.params.id;
const token = req.cookies.token
const categories=await Category.find()
      // Fetch the offer details
      const productoffer = await ProductOffer.findById(offerId);

      // Fetch the products associated with the offer
      const products = await Product.find({ _id: { $in: productoffer.products } });

      // Render the offer detail page with offer and products
      res.render('productofferdetail', { productoffer, products,token,categories });
  } catch (error) {
      console.error('Error fetching offer details:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};
exports.getCategoryOfferDetail = async (req, res) => {
  try {
      const offerId = req.params.id;
      const token = req.cookies.token
      const categories=await Category.find()
      // Fetch the category offer details
      const categoryOffer = await CategoryOffer.findById(offerId).populate('category');

      // Fetch the products associated with the category offer
      const products = await Product.find({ category: categoryOffer.category });

      // Render the category offer detail page with offer and products
      res.render('categoryofferdetail', { categoryOffer, products,token,categories });
  } catch (error) {
      console.error('Error fetching category offer details:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
};



exports.filterProducts=async(req,res)=>{
  try {
    // Fetch all products from the database
    const products = await Product.find().populate('category');
    res.json({ products });
} catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
}
}


exports.filterProductsByCategory=async(req,res)=>{
  try{
    console.log("started")
    const categoryId = req.params.categoryId;
    const products = await Product.find({ category: categoryId }).populate('category');
    console.log(products);
    res.json({ products });
  }catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
}
  
}