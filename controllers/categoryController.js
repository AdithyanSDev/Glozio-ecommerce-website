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
  res.render('category/add', { errorMessage: null, name: '', description: '' });
};


exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    // Check if the category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.render('category/add', { errorMessage: 'Category already exists', name, description });
    }
    const newCategory = new Category({ name, description });
    await newCategory.save();
    res.redirect('/admin/categories');
  } catch (error) {
    console.error(error);
    res.render('404page');
  }
};


exports.showEditCategoryForm = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const Category = await Category.findById(categoryId);
    res.render('category/edit', { Category,errorMessage: null, name: '', description: '' }); 
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};

exports.editCategory = async (req, res) => {
  const { name} = req.body;
  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return  res.render('category/edit', { errorMessage: 'Category already exists', name, description });
    }
    const categoryId = req.params.categoryId;
    const category = await Category.findById(categoryId);
    res.render('category/edit', { category,errorMessage: null, name: '', description: '' }); 
  } catch (error) {
    console.error(error);
    res.render('404page')
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const category=await Category.findById(categoryId);
    const { name, description } = req.body;
    console.log(name,description);
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return  res.render('category/edit', {category, errorMessage: 'Category already exists', name, description });
    }
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
    // Find all products belonging to the category
    const productsToDelete = await Product.find({ category: categoryId });
    // Delete all products found
    await Product.deleteMany({ category: categoryId });
    // Delete the category
    await Category.findByIdAndDelete(categoryId);
    res.redirect('/admin/categories?msg=del');
  } catch (error) {
    console.error(error);
    res.render('404page');
  }
};
// Controller
exports.toggleCategory = async (req, res) => {
  try {
      const categoryId = req.params.categoryId;
      const category = await Category.findById(categoryId);

      // Toggle the category status
      category.isBlocked = !category.isBlocked;
      await category.save();

      res.status(200).json({ success: true });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
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
