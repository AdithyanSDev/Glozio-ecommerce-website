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
    default: null, // or provide a default password here
  },
  isBlocked: {
    type: String,
    default: "Unblocked",
    enum: ["Unblocked", "Blocked"]
  },
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address'
  }],
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
