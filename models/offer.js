// Offer Schema
const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
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
    // Add other fields as per your requirements
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
