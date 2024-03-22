const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true 
  },
  product: [{
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true
    },
    name: String,
    price: Number,
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