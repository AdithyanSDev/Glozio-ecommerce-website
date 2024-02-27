const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] 
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
