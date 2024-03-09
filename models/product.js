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
  sellingPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: function () {
      // Calculate discount based on price and selling price
      return ((this.price - this.sellingPrice) / this.price) * 100;
    },
    validate: {
      validator: function () {
        // Ensure discount is valid
        return this.discount >= 0 && this.discount <= 100;
      },
      message: 'Discount percentage must be between 0 and 100',
    },
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  brand: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  highlights: [String],
  images: [String],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
