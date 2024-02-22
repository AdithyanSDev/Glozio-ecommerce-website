const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    name: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    pincode: {
        type: String,
        required: true
    },
    locality: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    addressType: {
        type: String,
        enum: ['Home', 'Work'],
        required: true
    }
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
