const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        required: true,
    },
    product: [{
        productId: {
            type: mongoose.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: String, // Added for product name
        price: Number, // Added for product price
        quantity: {
            type: Number,
            default: 1
        }
    }],
    subtotal: {
        type: Number,
        default: 0
    }
});

const cartModel = mongoose.model("cart", cartSchema);
module.exports = cartModel;