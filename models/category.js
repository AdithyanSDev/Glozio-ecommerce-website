// models/category.js
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
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
    