const mongoose = require('mongoose');

const productOfferSchema = new mongoose.Schema({
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
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  expiryDate: {
    type: Date,
    required: true
}
}, { timestamps: true });

const ProductOffer = mongoose.model('ProductOffer', productOfferSchema);

module.exports = ProductOffer;
