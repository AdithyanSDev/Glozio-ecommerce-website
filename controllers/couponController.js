const Coupon = require('../models/coupon');

exports.renderCoupon = async (req, res) => {
    try {
        // Fetch coupons from the database
        const coupons = await Coupon.find();

        // Render the admincoupon.ejs template with the coupons data
        res.render('admincoupon', { coupons });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

exports.renderAddcoupon=async(req,res)=>{
    res.render('addcoupon');
}

//add coupen
exports.createCoupon = async (req, res) => {
    try {
        // Extract coupon details from the request body
        const { code, discountAmount, minimumPurchaseAmount, expiryDate } = req.body;

        // Create a new coupon object
        const coupon = new Coupon({
            code,
            discountAmount,
            minimumPurchaseAmount,
            expiryDate
        });

        // Save the coupon to the database
        await coupon.save();

        // Redirect to a success page or render a success message
        res.redirect('/admin/coupon');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};


exports.removeCoupon=async(req,res)=>{
    try {
        const { couponId } = req.body;

        // Check if the coupon ID is valid
        if (!couponId) {
            return res.status(400).json({ message: 'Coupon ID is required' });
        }

        // Find the coupon by ID and delete it
        const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

        if (!deletedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Redirect to a success page or send a success response
        res.redirect('/admin/coupon');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}