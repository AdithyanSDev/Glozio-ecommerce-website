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
        },
        reviewed: {
            type: Boolean,
            default: false
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
        name: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        pincode: { type: String, required: true },
        locality: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        addressType: { type: String, enum: ['Home', 'Work'], required: true }
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
