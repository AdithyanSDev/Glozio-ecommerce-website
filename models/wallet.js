const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    balance: {
        type: Number,
        default: 0
    }
});

const WalletModel = mongoose.model("Wallet", WalletSchema);

module.exports = WalletModel;
