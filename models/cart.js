const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        required: true
    },
    productId: {
        type: ObjectId,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Reference to the Product model
        required: true
    }
});


const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
