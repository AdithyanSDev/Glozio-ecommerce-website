const Product = require('../models/product'); // Import the Product model

// Assuming you have a route handler for rendering the detail page
exports.renderDetailPage = async (req, res) => {
  try {
      const productId = req.params.productId;
      const product = await Product.findById(productId); // Assuming Product is your Mongoose model

      // Fetch other related products
      const Products = await Product.find({ /* Your query criteria */ }).limit(5); // Fetch related products, adjust the query as needed
      
      // Render the detail page and pass the product object and related products array
      res.render('detail', { product: product, Products: Products });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};
