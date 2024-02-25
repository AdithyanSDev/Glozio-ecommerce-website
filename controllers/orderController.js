
const Address = require('../models/address');
const Order = require('../models/order');
const Category = require('../models/category')


exports.renderorderPage=async(req,res)=>{
    try {
        const userId = req.userId; 
        const categories = await Category.find({ isDeleted: false }).populate('products');
        const token = req.cookies.token;
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 }); 
        res.render('ordersuccess', { orders: orders,token,categories });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}



exports.placeOrder = async (req, res) => {
   
    try {
        console.log("dllhd",req.body)
        const userId = req.userId;
        const usercart = JSON.parse(req.body.usercart);
        const addressId = req.body.addressId
        const paymentMethod=req.body.paymentMethod
       console.log(addressId)
        console.log("payment method", paymentMethod);
        const address = await Address.findById(addressId);
        
        if (!address) {
            return res.status(400).json({ message: 'Selected address not found' });
        }
        
        let totalAmount = 0;
        usercart.product.forEach(product => {
            totalAmount += product.productId.sellingPrice * product.quantity;
        });

        const order = new Order({
            userId: userId,
            orderedItems: usercart.product,
            totalAmount: totalAmount,
            shippingAddress: address,
            paymentMethod: paymentMethod 
        });
        await order.save();
        res.redirect('/orderpage');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
