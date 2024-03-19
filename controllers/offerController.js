// offerController.js
const Offer = require('../models/offer');
const cron = require('node-cron');


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
    console.log(req.params);
    console.log(req.body); 

    try {
        const { id } = req.params;
        const updates = req.body;
        const images = req.files;
        let offer = await Offer.findById(id);
        if (!offer) {
            return res.status(404).send('Offer not found');
        }
        const existingOffer = await Offer.findOne({ title: updates.title, _id: { $ne: id } });
        if (existingOffer) {
            return res.status(400).send('Another offer with the same name already exists');
        }
        if (images && images.length > 0) {
            offer.bannerImg = offer.bannerImg ? offer.bannerImg.concat(images.map(image => image.path)) : images.map(image => image.path);
            await offer.save();
        }
        console.log(req.files);
        await Offer.findByIdAndUpdate(id, updates);
        res.redirect('/admin/offer');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.offerimagedelete = async (req, res) => {
    try {
        console.log("Entering image deletion controller");
        const offerId = req.params.offerId;
        const index = req.params.index;
        console.log("Index:", index);
  console.log(offerId)
        let offer = await Offer.findById(offerId);
        console.log("offer:", offer);
  
        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }
  
        if (index < 0 || index >= offer.bannerImg.length) {
            return res.status(400).json({ message: "Invalid image index" });
        }
  
        offer.bannerImg.splice(index, 1);
        await offer.save();
  
        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
  };



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