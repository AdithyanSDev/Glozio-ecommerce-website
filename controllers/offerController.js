// offerController.js
const Offer = require('../models/offer');
const cron = require('node-cron');
const ProductOffer = require('../models/productoffer');
const CategoryOffer = require('../models/categoryoffer');
const Category = require('../models/category'); 
const Product=require("../models/product");


const deleteExpiredOffers = async () => {
    try {
        const currentDate = new Date();
        // Find offers with expiry date less than or equal to current date
        const expiredOffers = await Offer.find({ expiryDate: { $lte: currentDate } });
        console.log(expiredOffers,"hello");
        // Delete expired offers from the database
        await Offer.deleteMany({ _id: { $in: expiredOffers.map(offer => offer._id) } });
        console.log('Expired offers deleted:', expiredOffers.length);
    } catch (error) {
        console.error('Error deleting expired offers:', error);
    }
};

// Schedule task to run every day at midnight to delete expired offers
cron.schedule('0 0 * * *', deleteExpiredOffers);



 exports.renderOffer=async(req,res)=>{
        
        try {
            const productOffers = await ProductOffer.find();
            const categoryOffers = await CategoryOffer.find();
            const offer = await Offer.find();
            res.render('adminoffer', { offer: offer,productOffers,categoryOffers     });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }



/////////////////////////////////product offer controller////////////////////////////////


exports.addproductofferpage=async(req,res)=>{
    try{
        const products=await Product.find()
        res.render('adminproductoffer',{products})
    } catch (error) {
        console.error('Error creating product offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}
// Create a new product offer
exports.createProductOffer = async (req, res) => {
    try {
        const { title, description, discount, expiryDate, products } = req.body;
        const bannerImg = req.files.map(file => file.filename);
        const productIds = req.body.products;

        // Fetch products to validate prices
        const productsToUpdate = await Product.find({ _id: { $in: productIds } });

        // Check if the offer will cause the price to be negative
        const invalidProducts = productsToUpdate.filter(product => {
            const newSellingPrice = product.sellingPrice - discount;
            return newSellingPrice < 0; // Product price will be negative
        });

        if (invalidProducts.length > 0) {
            return res.redirect('/admin/addproductofferpage?msg=invalid')
        }

        // Create the new product offer
        const newProductOffer = new ProductOffer({
            title,
            description,
            bannerImg,
            discount,
            products: productIds, // Use the extracted product IDs
            expiryDate
        });

        // Save the new product offer
        await newProductOffer.save();

        // Update the products with the offer reference
        await Product.updateMany(
            { _id: { $in: productIds } },
            { $set: { productOffer: newProductOffer._id } }
        );

        res.redirect('/admin/offer'); // Redirect to product offers page
    } catch (error) {
        console.error('Error creating product offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



// Render the page for editing a product offer
exports.editProductOfferPage = async (req, res) => {
    try {
        const productOffer = await ProductOffer.findById(req.params.id);
        if (!productOffer) {
            return res.status(404).send('Product offer not found');
        }
        const products = await Product.find(); // Fetch products
        res.render('editproductoffer', { productOffer, products }); // Pass products to the view
    } catch (error) {
        console.error('Error rendering edit product offer page:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
// Update an existing product offer
exports.updateProductOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Extract product IDs from the products object
        let productIds = req.body.products;
        if (!Array.isArray(productIds)) {
            // If productIds is not an array, convert it to an array
            productIds = [productIds];
        }

        // Fetch products to validate prices
        const productsToUpdate = await Product.find({ _id: { $in: productIds } });

        // Check if the offer will cause the price to be negative
        const invalidProducts = productsToUpdate.filter(product => {
            const newSellingPrice = product.sellingPrice - updates.discount;
            return newSellingPrice < 0; // Product price will be negative
        });

        if (invalidProducts.length >= 0) {
            return res.redirect(`/admin/${id}/edit?msg=invalid`)
        }

        // Check if files are uploaded
        if (req.files && req.files.length > 0) {
            const bannerImg = req.files.map(file => file.filename);
            updates.bannerImg = bannerImg;
        }

        // Check if products are selected
        if (productIds && productIds.length > 0) {
            updates.products = productIds;

            // Update the products with the offer reference
            await Product.updateMany(
                { _id: { $in: productIds } },
                { $set: { productOffer: id } }
            );
        } else {
            // If no new products are selected, keep the existing ones
            const existingOffer = await ProductOffer.findById(id);
            updates.products = existingOffer.products;
        }

        await ProductOffer.findByIdAndUpdate(id, updates);

        res.redirect('/admin/offer'); // Redirect to product offers page
    } catch (error) {
        console.error('Error updating product offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete a product offer
exports.deleteProductOffer = async (req, res) => {
    try {
        // Find and delete the product offer
        const productOffer = await ProductOffer.findByIdAndDelete(req.params.id);
        if (!productOffer) {
            return res.status(404).send('Product Offer not found');
        }

        // Remove the reference to the deleted product offer from all products
        await Product.updateMany(
            { productOffer: productOffer._id },
            { $unset: { productOffer: 1 } }
        );

        res.redirect('/admin/offer'); // Redirect to product offers page
    } catch (error) {
        console.error('Error deleting product offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

exports.productofferimagedelete = async (req, res) => {
    try {
        console.log("Entering image deletion controller");
        const offerId = req.params.offerId;
        const index = req.params.index;
        console.log("Index:", index);
  console.log(offerId)
        let productoffer = await ProductOffer.findById(offerId);
        console.log("offer:", productoffer);
  
        if (!productoffer) {
            return res.status(404).json({ message: "Offer not found" });
        }
  
        if (index < 0 || index >= productoffer.bannerImg.length) {
            return res.status(400).json({ message: "Invalid image index" });
        }
  
        productoffer.bannerImg.splice(index, 1);
        await productoffer.save();
  
        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };



 //////////////////category offer controller//////////////////////////////////
  exports.addcategoryofferpage = async (req, res) => {
    try {
        // Fetch categories from the database
        const categories = await Category.find();
        res.render('admincategoryoffer', { categories }); // Pass categories to the EJS template
    } catch (error) {
        console.error('Error creating category offer:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

// Controller function to create a new category offer
exports.createCategoryOffer = async (req, res) => {
    try {
        const { title, description, discount, category, expiryDate } = req.body;
console.log(discount)
        // Check if discount is 100
        if (discount === '100') {
            return res.redirect('/admin/addcategoryofferpage?msg=invaliddiscount');
        }
        

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            throw new Error('No files were uploaded.');
        }

        // Get the filenames of the uploaded images
        const bannerImgs = req.files.map(file => file.filename);

        // Create a new category offer instance
        const newCategoryOffer = new CategoryOffer({
            title,
            description,
            discount,
            category,
            expiryDate,
            bannerImg: bannerImgs // Assign array of filenames
        });

        // Save the category offer
        const savedCategoryOffer = await newCategoryOffer.save();

        // Update products with the new category offer
        await Product.updateMany(
            { category: category }, // Find products with the same category
            { $set: { categoryOffer: savedCategoryOffer._id } } // Set categoryOffer reference
        );

        res.redirect('/admin/offer');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// In your offerController.js file
exports.editCategoryOfferPage = async (req, res) => {
    try {
        const categories = await Category.find();
        const categoryOffer = await CategoryOffer.findById(req.params.id).populate('category');
        if (!categoryOffer) {
            return res.status(404).send('Category offer not found');
        }
        res.render('editcategoryoffer', { categoryOffer, categories });
    } catch (error) {
        console.error('Error rendering edit category offer page:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.editCategoryOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const images = req.files;

        let categoryOffer = await CategoryOffer.findById(id);
        if (!categoryOffer) {
            return res.status(404).send('Category Offer not found');
        }

        // Update banner images if new images are uploaded
        if (images && images.length > 0) {
            const newBannerImages = images.map(image => image.filename);
            categoryOffer.bannerImg = categoryOffer.bannerImg ? categoryOffer.bannerImg.concat(newBannerImages) : newBannerImages;
        }

        // Check if the discount value is 100%
        if (updates.discount === '100') {
            return res.redirect(`/admin/edit/${id}?msg=error`);
        }

        // Update the category offer without modifying product prices
        await categoryOffer.save();

        // Remove 'products' property if it's not intended to be updated
        delete updates.products;

        // Get the previous category of the category offer
        const previousCategory = categoryOffer.category;

        // Update the category offer details
        await CategoryOffer.findByIdAndUpdate(id, updates);

        // Get the new category of the category offer after updates
        const newCategory = updates.category;

        // Update the products in the previous category
        await Product.updateMany(
            { category: previousCategory, categoryOffer: id },
            { $unset: { categoryOffer: 1 } }
        );

        // Update the products in the new category
        await Product.updateMany(
            { category: newCategory },
            { $set: { categoryOffer: id } }
        );

        res.redirect('/admin/offer');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.deleteCategoryOffer = async (req, res) => {
    try {
        // Find and delete the category offer
        const categoryOffer = await CategoryOffer.findByIdAndDelete(req.params.id);
        if (!categoryOffer) {
            return res.status(404).send('Category Offer not found');
        }

        // Remove the reference to the deleted category offer from all products
        await Product.updateMany(
            { categoryOffer: categoryOffer._id },
            { $unset: { categoryOffer: 1 } }
        );

        res.redirect('/admin/offer'); 
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};


exports.categoryofferimagedelete = async (req, res) => {
    try {
        console.log("Entering image deletion controller");
        const offerId = req.params.offerId;
        const index = req.params.index;
        console.log("Index:", index);
  console.log(offerId)
        let categoryoffer = await CategoryOffer.findById(offerId);
        console.log("offer:", categoryoffer);
  
        if (!categoryoffer) {
            return res.status(404).json({ message: "Offer not found" });
        }
  
        if (index < 0 || index >= categoryoffer.bannerImg.length) {
            return res.status(400).json({ message: "Invalid image index" });
        }
  
        categoryoffer.bannerImg.splice(index, 1);
        await categoryoffer.save();
  
        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };