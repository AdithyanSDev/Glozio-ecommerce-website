
const Address = require('../models/address');
const Order = require('../models/order');
const Category = require('../models/category')
const Cart = require('../models/cart')
const Product = require('../models/product')
const Wallet = require('../models/wallet');
const User =require( '../models/user');
const PDFDocument = require('pdfkit');
const Razorpay = require('razorpay');
const Coupon=require('../models/coupon')
const{RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET}=process.env

const razorpaykeyId= RAZORPAY_KEY_ID;
// Initialize Razorpay with your API key and secret
const razorpay = new Razorpay({
    key_id: 'rzp_test_xKuv2UTXtdieZH',
    key_secret: 'C2zUJ4U2NJBAfLY67YpxdOe9'
  
});
exports.renderorderPage=async(req,res)=>{
    try {
        const userId = req.userId; 
        
        const categories = await Category.find({ isDeleted: false }).populate('products');
        const token = req.cookies.token;
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 }); 
        res.render('ordersuccess', { orders: orders,token,categories});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

exports.placeOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const usercart = JSON.parse(req.body.usercart);
        const addressId = req.body.addressId;
        const paymentMethod = req.body.paymentMethod;

        // Fetch the address details using the addressId
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Calculate total amount and store product details with current price
        let totalAmount = 0;
        const orderedItems = [];

        for (const product of usercart.product) {
            const productData = await Product.findById(product.productId).populate(['productOffer', 'categoryOffer']);

            if (!productData || productData.stock < product.quantity) {
                return res.redirect('/checkout?msg=stock');
            }

            // let price = productData.sellingPrice; // Initialize price with regular selling price

            // // Check if the product has an offer and if it's not expired
            // if (productData.productOffer && productData.productOffer.expiryDate >= new Date()) {
            //     const discount = productData.productOffer.discount;
            //     price -= discount; // Reduce the price by the discount amount
            // }

            // // Check if the product has a category offer and if it's not expired
            // if (productData.categoryOffer && productData.categoryOffer.expiryDate >= new Date()) {
            //     const discount = productData.categoryOffer.discount;
            //     price -= (price * (discount / 100)); // Reduce the price by the category offer discount percentage
            // }

            const orderedProduct = {
                productId: product.productId,
                quantity: product.quantity,
                price: usercart.subtotal // Store the final price
            };

            orderedItems.push(orderedProduct);
            totalAmount += orderedProduct.price * orderedProduct.quantity;

            // Deduct quantity from product stock
            productData.stock -= product.quantity;
            await productData.save();
        }

        // Retrieve coupon code from query parameters
        const couponCode = req.session.couponCode;
console.log(couponCode)
        if (couponCode) {
            // Find the user and populate coupons
            const user = await User.findById(userId).populate('coupons');
console.log(user)
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Find the coupon in the user's coupons array
            const coupon = user.coupons.find(c => c.code === couponCode);
console.log(coupon,"coupon")
            // Check if the coupon exists and is valid
            if (coupon && coupon.expiryDate >= new Date()) {
                // Calculate the discount amount based on the coupon
                const discountAmount = coupon.discountAmount;

                // Apply the discount to the total amount
                totalAmount -= discountAmount;
            }
        }

        // Check if total amount is above 1000 for COD
        if (paymentMethod === 'Cash On Delivery' && totalAmount > 1000) {
            return res.status(400).json({ message: 'Cash On Delivery is not allowed for orders above 1000' });
        }

        // Create the order with the fetched address details and store the reduced price
        const order = new Order({
            userId: userId,
            orderedItems: orderedItems,
            totalAmount: totalAmount,
            paymentMethod: paymentMethod,
            shippingAddress: {
                name: address.name,
                mobileNumber: address.mobileNumber,
                pincode: address.pincode,
                locality: address.locality,
                address: address.address,
                city: address.city,
                state: address.state,
                addressType: address.addressType
            }
        });

        // Set payment status based on payment method
        if (paymentMethod === 'Wallet') {
            order.paymentStatus = 'Completed';
        } else if (paymentMethod === 'Razorpay') {
            // Implement Razorpay logic
        } else if (paymentMethod === 'Cash On Delivery') {
            order.paymentStatus = 'Failed'; // Set payment status to failed for COD
        }

        // Handle wallet payment
        if (paymentMethod === 'Wallet') {
            let wallet = await Wallet.findOne({ userId });

            if (!wallet || wallet.balance < totalAmount) {
                return res.redirect(`/checkout?msg=${!wallet ? 'err' : 'balance'}`);
            } else {
                wallet.balance -= totalAmount;
                await wallet.save();
            }
        }

        // Save the order
        await order.save();

        // Remove ordered products from the cart
        await Cart.findOneAndUpdate(
            { user: userId },
            { $pull: { product: { productId: { $in: usercart.product.map(item => item.productId) } } }, $set: { subtotal: 0 } },
            { new: true }
        );

        // Redirect to order success page
        return res.redirect('/orderpage');
    } catch (error) {
        console.error(error);
        res.render('404page');
    }
};




exports.renderOrderList = async (req, res) => {
    try {
        // Fetch orders, categories, and user from the database
        const orders = await Order.find({ userId: req.userId }).populate('orderedItems.productId').sort({ orderDate: -1 });
        const categories = await Category.find({ isDeleted: false }).populate('products');
        const user = await User.findById(req.userId);

        

        // Render the order list page and pass the orders, categories, user, and cancelledProducts data to the view
        res.render('orderlist', { orders, categories, user});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};



exports.listUserOrders = async (req, res) => {
    try {
        const userId = req.userId; // Assuming you have implemented user authentication and obtained the userId
        
        // Find orders for the current user
        const orders = await Order.find({ userId: userId }).sort({ orderDate: -1 }); // Assuming you want to sort orders by orderDate in descending order

        // Render the orders page and pass the orders data to the view
        res.render('orderlist', { orders: orders });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};


exports.cancelOrder = async (req, res) => {
    try {
        const orderId = req.body.orderId;
        const order = await Order.findById(orderId);

        // Check if order exists
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
// Add the price of cancelled products to the user's wallet
        const totalPrice = order.totalAmount;
        const userId = order.userId;

        // Find the wallet associated with the user
        let wallet = await Wallet.findOne({ userId });

        // If wallet does not exist, create a new wallet
        if (!wallet) {
            wallet = new Wallet({ userId, balance: totalPrice });
            await wallet.save();
        } else {
            // Update wallet balance
            wallet.balance += totalPrice;
            await wallet.save();
        }
        // Increment stock for each ordered product
        for (const item of order.orderedItems) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: 'Product not found for restocking' });
            }
            // Increment product stock by the quantity ordered
            product.stock += item.quantity;
            await product.save();
        }

        // Update order status
        order.orderStatus = 'Cancelled';
        await order.save();

        res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


//admin orders
exports.adminOrders = async (req, res) => {
    try {
        // Fetch orders from the database
        const orders = await Order.find().populate([
            { path: 'userId', select: 'name' }, // Populate with 'name' field instead of 'username'
            { path: 'orderedItems.productId', select: 'name category price' },
            { path: 'shippingAddress' }
        ]).sort({ orderDate: -1 });

        // Render the adminorderlist.ejs view and pass the orders data to it
        res.render('adminorderlist', { orders: orders });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const { orderStatus } = req.body;

        // Update the order status in the database
        const updatedOrder = await Order.findByIdAndUpdate(orderId, { orderStatus }, { new: true });

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If order is cancelled or returned, add the order quantity back to the product's quantity
        if (orderStatus === 'Cancelled' || orderStatus === 'Returned') {
            for (const item of updatedOrder.orderedItems) {
                const productId = item.productId;
                const quantity = item.quantity;

                // Find the product and update its quantity
                await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
            }
        }

        res.status(200).json({ message: 'Order status updated successfully', order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


exports.orderdetails = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const userId = req.userId; 
        const categories = await Category.find({ isDeleted: false }).populate('products');
        const token = req.cookies.token;

        // Fetch order details including the address information
        const order = await Order.findById(orderId).populate('shippingAddress');

        // Fetch product details
        const product = await Product.findById(productId); // Assuming you have a Product model
        
        res.render('orderdetails', { orderId, productId, categories, token, order, product });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
exports.processReturn = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Find the order by ID
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Update the order status to 'ReturnRequested'
        order.orderStatus = 'ReturnRequested';
        await order.save();
console.log(order)
        // Calculate the total amount to be refunded
        let totalRefundAmount = 0;
        for (const item of order.orderedItems) {
            totalRefundAmount += item.productId.sellingPrice; 
        }

        // Find the user associated with the order
        const user = await User.findById(order.userId);
console.log(user,"user")
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the wallet associated with the user
        const wallet = await Wallet.findOne({ user: user.id });

        if (!wallet) {
            // If the wallet doesn't exist, you may need to handle this scenario based on your application's logic
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Add the total refund amount to the wallet balance
        wallet.balance += totalRefundAmount;

        // Save the updated wallet data
        await wallet.save();
console.log(wallet,"walletidfihdsfousdfhnoadih")
        // Send a success response
        res.render('orderlist');
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.renderRazorpayPage = async (req, res) => {
    try {
        const userId = req.userId; // Assuming user ID is available in the request
        if (!userId) {
            return res.status(400).json({ message: 'User ID not found' });
        }

        // Retrieve user's cart
        const userCart = await Cart.findOne({ user: userId }).populate('product.productId');
    
        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const order = await Order.findById(req.params.orderId)
            .populate({
                path: 'orderedItems.productId',
                select: 'name images' // Select only necessary fields
            })
            .populate('userId shippingAddress');

        if (!order) {
            return res.status(404).json({ message: 'Order with Razorpay payment method not found' });
        }

        const user = await User.findById(userId);

        // Calculate total amount
        let totalAmount = 0;
        userCart.product.forEach(item => {
            totalAmount += item.productId.price * item.quantity;
        });

        // Fetch categories
        const categories = await Category.find({ isDeleted: false });

        res.render('razorpay', { order, categories, user, totalAmount, razorpaykeyId: razorpaykeyId });

    } catch (error) {
        console.error("Error in rendering RazorPay Page");
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

exports.razorsuccess = async (req, res) => {
    try {
        const cartId = req.params.cartId;
        let addressId = req.body.addressId;

        // Ensure addressId is a single ObjectId
        if (Array.isArray(addressId)) {
            addressId = addressId[0]; // Select the first addressId
        }

        console.log(addressId, "addrid");

        // Find the cart by cartId
        const cart = await Cart.findById(cartId);

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Retrieve the shipping address details by addressId
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ message: 'Shipping address not found' });
        }

        // Calculate total amount and store product details with current price
        let totalAmount = 0;
        const orderedItems = [];

        for (const item of cart.product) {
            const productData = await Product.findById(item.productId).populate(['productOffer', 'categoryOffer']);

            if (!productData || productData.stock < item.quantity) {
                return res.redirect('/checkout?msg=stock');
            }

            // let price = productData.sellingPrice; // Initialize price with regular selling price

            // // Check if the product has an offer and if it's not expired
            // if (productData.productOffer && productData.productOffer.expiryDate >= new Date()) {
            //     const discount = productData.productOffer.discount;
            //     price -= discount; // Reduce the price by the discount amount
            // }

            // // Check if the product has a category offer and if it's not expired
            // if (productData.categoryOffer && productData.categoryOffer.expiryDate >= new Date()) {
            //     const discount = productData.categoryOffer.discount;
            //     price -= (price * (discount / 100)); // Reduce the price by the category offer discount percentage
            // }

            const orderedProduct = {
                productId: item.productId,
                quantity: item.quantity,
                price: cart.subtotal // Store the final price
            };

            orderedItems.push(orderedProduct);
            totalAmount += orderedProduct.price * orderedProduct.quantity;

            // Deduct quantity from product stock
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        // Update cart subtotal
        cart.subtotal = totalAmount;
        await cart.save();

        // Create a new order based on the cart details and shipping address
        const newOrder = new Order({
            userId: cart.user,
            orderedItems: orderedItems,
            paymentMethod: 'Razorpay',
            totalAmount: cart.subtotal, // Assign the cart subtotal as the total amount
            // Assign the shipping address details
            shippingAddress: {
                name: address.name,
                mobileNumber: address.mobileNumber,
                pincode: address.pincode,
                locality: address.locality,
                address: address.address,
                city: address.city,
                state: address.state,
                addressType: address.addressType
            },
            orderStatus: 'Pending'
        });

        // Save the new order
        const savedOrder = await newOrder.save();

        // Update the payment status to "Completed" for the order
        await Order.findOneAndUpdate({ _id: savedOrder._id }, { paymentStatus: 'Completed' });

        // Remove ordered products from the cart
        await Cart.findByIdAndUpdate(cartId, { $pull: { product: { productId: { $in: cart.product.map(item => item.productId) } } } });

        res.redirect('/orderpage');
    } catch (error) {
        console.error('Error in processing Razorpay payment');
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



exports.paylater = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        // Find the order by orderId
        const order = await Order.findById(orderId);

        if (!order) {
            return res.render('404page')
        }

        // Update payment status to 'Completed'
        order.paymentStatus = 'Completed';
        await order.save();

        // Remove ordered products from the cart
        const userId = order.userId;
        const orderedItems = order.orderedItems;
        await Cart.findOneAndUpdate(
            { user: userId },
            { $pull: { product: { productId: { $in: orderedItems.map(item => item.productId) } } } },
            { new: true }
        );

        res.redirect('/orderpage');
    } catch (error) {
        console.error('Error in updating payment status');
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};






exports.generateReport = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate({
                path: 'orderedItems.productId',
                select: 'name price discount images'
            })
            .populate('userId shippingAddress');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const doc = new PDFDocument();
        // Set content disposition to attachment so that the browser will prompt the user to download the PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=order_invoice.pdf');
        doc.pipe(res);

        // Add content to the PDF document based on the order details
        doc.image('public/img/Gloziologo.png', {
            width: 25,
            align: 'center'
        }).moveDown(0.5); 

        doc.fontSize(20).text('GLOZIO', { align: 'left' });
        doc.fontSize(18).text('Order Invoice', { align: 'center' });
        doc.moveDown();

         // Order details
         doc.fontSize(12).text(`Order ID: ${order._id}`);
         doc.fontSize(12).text(`Order Date: ${order.orderDate.toDateString()}`);
         doc.fontSize(12).text(`Payment Status: ${order.paymentStatus}`); 
         doc.moveDown();
 

        // User details
        doc.fontSize(12).text(`User Name: ${order.userId.name}`);
        doc.fontSize(12).text(`User Address: ${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.pincode}`);
        doc.moveDown();

        // Ordered items
      // Ordered items
order.orderedItems.forEach(item => {
    doc.fontSize(12).text(`Product: ${item.productId.name}`);
    doc.fontSize(12).text(`Quantity: ${item.quantity}`);
    doc.fontSize(12).text(`Price: Rs.${item.productId.price}`);
    doc.fontSize(12).text(`Discount: ${item.productId.discount}%`);

    // Include product image if available
    if (item.productId.images && item.productId.images.length > 0) {
        const img = item.productId.images[0]; // Changed to index 0 if you want the first image
        doc.image(img, { width: 100, height: 100 }).moveDown(); // You might want to adjust the width and height
    }

    doc.moveDown();
});

        // Total amount
        doc.fontSize(14).text(`Total Amount: Rs.${order.totalAmount}/-`, { align: 'right' });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

