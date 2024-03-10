// Offer Schema
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    bannerImg: {
        type: [String],
        required: true
    },
    type: {
        type: String,
        enum: ['Product', 'Category', 'Referral'],
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });
 

module.exports = mongoose.model('Offer', offerSchema);
