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
  discount:{
type:Number,
required:true,
  },
  images: {
    type: [String],  
    required: true,
    validate: [arrayLimit, 'At least 3 images are required'],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

// Validator function to check array length
function arrayLimit(val) {
  return val.length >= 3;
}

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
