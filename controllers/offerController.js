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

// Controller for editing an offer
exports.editOffer = async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }
        // Render edit form
        res.render('editOffer', { offer });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};


exports.editofferpost = async (req, res) => {
    console.log(req.params)
    console.log(req.body) 

    try {
        const { id } = req.params;
        const { title, description, bannerImg, type, discount, expiryDate } = req.body;

        // Find the offer by ID
        let offer = await Offer.findById(id);

        // Update offer properties if they are provided
        if (title) offer.title = title;
        if (description) offer.description = description;
        if (bannerImg) offer.bannerImg = bannerImg;
        if (type) offer.type = type;
        if (discount) offer.discount = discount;
        if (expiryDate) offer.expiryDate = expiryDate;

        // Save the updated offer
        offer = await offer.save();

        res.redirect('/admin/offer');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}




// Controller for deleting an offer
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }
        res.redirect('/admin/offer'); // Redirect to the offers page after deletion
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};