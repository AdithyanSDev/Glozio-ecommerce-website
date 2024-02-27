// controllers/categoryController.js

const Category = require('../models/category');
const Product = require('../models/product');

exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    res.render('category/list', { categories });
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};

exports.showAddCategoryForm = (req, res) => {
  res.render('category/add');
};

exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Check if the category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).send('Category already exists');
    }
    const newCategory = new Category({ name, description });
    await newCategory.save();
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};

exports.showEditCategoryForm = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const Category = await Category.findById(categoryId);
    res.render('category/edit', { Category }); 
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};

exports.editCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);
    res.render('category/edit', { category }); // This line renders the edit.ejs template with the category data
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { name, description } = req.body;
    await Category.findByIdAndUpdate(categoryId, { name, description });
    res.redirect('/admin/categories'); // Redirect to the categories list after updating
  } catch (error) {
    console.error(error);
    res.render('404page') 
  }
};



exports.softDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};

exports.listProductsByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId).populate('products');
    res.render('category/products', { category });
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};
