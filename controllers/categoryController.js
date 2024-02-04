// controllers/categoryController.js
const Category = require('../models/category');

exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    res.render('category/list', { categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.showAddCategoryForm = (req, res) => {
  res.render('category/add');
};

exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCategory = new Category({ name, description });
    await newCategory.save();
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.showEditCategoryForm = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);
    res.render('category/edit', { category });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.editCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { name, description } = req.body;
    await Category.findByIdAndUpdate(categoryId, { name, description });
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.softDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};
