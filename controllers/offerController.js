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
    try {
        const { title, type, discount } = req.body;

        // Create a new offer instance
        const newOffer = new Offer({
            title,
            type,
            discount
         
        });

        const savedOffer = await newOffer.save();

        res.render('adminoffer')
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



