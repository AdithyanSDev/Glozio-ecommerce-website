const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
    default: 0, // Default discount is 0 if not provided
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  highlights: [String],
  images: {
    type: [String],
    required: function() {
      // Require at least 3 images when creating a new product
      return this.isNew ? this.images.length < 3 : false;
    }
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  totalPrice: {
    type: Number,
    default: function() {
      // Calculate total price based on price and discount
      return this.price * (1 - this.discount / 100);
    }
  },
  sellingPrice: {
    type: Number,
    default: function() {
      // Selling price is the calculated total price
      return this.totalPrice;
    }
  }
});

// Validator function to check array length
function arrayLimit(val) {
  return val.length >= 3;
}

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
