const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  otp: {
    type: Number,
    default: null,
  },
  otpExpiresAt: {
    type: Date,
    default: null,
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
