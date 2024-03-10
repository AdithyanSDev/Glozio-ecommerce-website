// offerController.js
const Offer = require('../models/offer');



    exports.renderOffer=async(req,res)=>{
        
        try {
        
            const offer = await Offer.find();
            res.render('adminoffer', { offer: offer });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }


exports.renderAddoffer=async(req,res)=>{
    res.render('addoffer')
}

// Controller function to create a new offer
exports.createOffer = async (req, res) => {
    console.log(req.body); // Log request body
    console.log(req.files); // Log uploaded files

    try {
        const { title, description, type, discount, expiryDate } = req.body;

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            throw new Error('No files were uploaded.');
        }

        // Get the filenames of the uploaded images
        const bannerImgs = req.files.map(file => file.filename);

        // Create a new offer instance
        const newOffer = new Offer({
            title,
            description,
            type,
            discount,
            expiryDate,
            bannerImg: bannerImgs // Assign array of filenames
        });

        const savedOffer = await newOffer.save();
        const offer = await Offer.find();
        res.redirect('/admin/offer');
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
