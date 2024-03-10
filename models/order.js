const mongoose = require('mongoose');
// Update the OrderSchema to include a reference to the coupon used
const OrderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    orderedItems: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    deliveryDate: {
        type: Date,
        default: null
    },
    payment: {
        type: mongoose.Types.ObjectId
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash On Delivery','Wallet','Razorpay']
    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    
    totalAmount: {
        type: Number,
        required: true
    },
    orderStatus: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled','ReturnRequested', 'Returned']
    }
});

const orderModel = mongoose.model("Order", OrderSchema);

module.exports = orderModel;
