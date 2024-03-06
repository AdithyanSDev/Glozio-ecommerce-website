// controllers/salesReportsController.js

const Order = require('../models/order');


exports.renderSalesreport = async (req, res) => {
    try {
        res.render('adminsalesreport', {
            dailySalesData: [], // Initialize empty array to avoid error if data not found
            weeklySalesData: [],
            yearlySalesData: [],
            customDateSalesData: []
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};
// Get daily sales report
exports.getDailySalesReport = async (req, res) => {
    try {
        // Query database for daily sales data
        const dailySalesData = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: new Date(new Date().setHours(00, 00, 00)),
                        $lt: new Date(new Date().setHours(23, 59, 59))
                    },
                    orderStatus: "Delivered"
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                    quantity: { $sum: "$totalAmount" }
                }
            }
        ]);
        res.render('adminsalesreport', { dailySalesData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

// Get weekly sales report
exports.getWeeklySalesReport = async (req, res) => {
    try {
        // Query database for weekly sales data
        const weeklySalesData = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: new Date(new Date().setDate(new Date().getDate() - 7)),
                        $lt: new Date()
                    },
                    orderStatus: "Delivered"
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%W", date: "$orderDate" } },
                    quantity: { $sum: "$totalAmount" }
                }
            }
        ]);
        res.render('adminsalesreport', { weeklySalesData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

// Get yearly sales report
exports.getYearlySalesReport = async (req, res) => {
    try {
        // Query database for yearly sales data
        const yearlySalesData = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: new Date(new Date().getFullYear(), 0, 1),
                        $lt: new Date(new Date().getFullYear() + 1, 0, 1)
                    },
                    orderStatus: "Delivered"
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y", date: "$orderDate" } },
                    quantity: { $sum: "$totalAmount" }
                }
            }
        ]);
        res.render('adminsalesreport', { yearlySalesData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

// Get custom date sales report
exports.getCustomDateSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        // Query database for sales data within the custom date range
        const customDateSalesData = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: new Date(startDate),
                        $lt: new Date(endDate)
                    },
                    orderStatus: "Delivered"
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
                    quantity: { $sum: "$totalAmount" }
                }
            }
        ]);
        res.render('adminsalesreport', { customDateSalesData });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};
