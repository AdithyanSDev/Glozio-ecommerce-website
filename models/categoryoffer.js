const mongoose = require('mongoose');

const categoryOfferSchema = new mongoose.Schema({
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
  discount: {
    type: Number,
    required: true,
  },
  category: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  expiryDate: {
    type: Date,
    required: true
}
}, { timestamps: true });

const CategoryOffer = mongoose.model('CategoryOffer', categoryOfferSchema);

module.exports = CategoryOffer;
