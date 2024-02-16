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
  
  sellingPrice: {
    type: Number,
    default: function() {
      // Selling price is the calculated total price
      return this.price * (1-this.discount/100);
    }
  }
});

// Validator function to check array length
function arrayLimit(val) {
  return val.length >= 3;
}

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
