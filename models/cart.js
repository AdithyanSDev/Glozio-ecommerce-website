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
        type: Object, // or adjust it to the schema of your Product model if available
        required: true
    }
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
