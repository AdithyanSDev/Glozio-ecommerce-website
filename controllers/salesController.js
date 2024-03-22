
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');
const Product=require("../models/product");
const Coupon=require("../models/coupon")
const PDFDocument = require('pdfkit-table');

const Order = require('../models/order');


exports.renderSalesreport = async (req, res) => {
    try {
        res.render('adminsalesreport', {
            dailySalesData: [],
            weeklySalesData: [],
            yearlySalesData: [],
            customDateSalesData: []
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal server error');
    }
};

exports.generateReport = async (req, res) => {
    try {
        const { filterType, startDate, endDate } = req.query;

        let salesData;
        let reportTitle;

        if (filterType === 'daily') {
            salesData = await getDailySales();
            reportTitle = 'Today';
        } else if (filterType === 'weekly') {
            salesData = await getWeeklySales();
            reportTitle = 'This Week';
        } else if (filterType === 'monthly') {
            salesData = await getMonthlySales();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            reportTitle = monthNames[new Date().getMonth()]; // Use current month if no startDate provided
        } else if (filterType === 'yearly') {
            salesData = await getYearlySales();
            reportTitle = `Yearly Sales Report (${new Date().getFullYear()})`;
        } else if (filterType === 'custom') {
            if (!startDate || !endDate) {
                throw new Error('Custom date range requires both start date and end date.');
            }
            salesData = await getCustomRangeSales(startDate, endDate);
            reportTitle = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
        }
        
        generatePDFReport(res, reportTitle, salesData);
       
    } catch (error) {
        console.error(error);
        res.render('404');
    }
};
async function generatePDFReport(res, reportTitle, salesData) {
    try {
        
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
        doc.pipe(res);

        doc.fontSize(20).text('GLOZIO', { align: 'center' });
        doc.fontSize(18).text(`Sales Report (${reportTitle})`, { align: 'center' });
        doc.moveDown(); 

        // Check if salesData is an array and has at least one element
        if (Array.isArray(salesData) && salesData.length > 0) {
            const { totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount } = salesData[0];
            
            // Table Headers
            const tableHeaders = ['Date', 'Total Sales', 'Total Order Amount', 'Total Discount', 'Total Coupon Discount'];
           
            const tableData = 
               salesData.map(({ date, totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount }) => 
                [new Date(date).toLocaleDateString(), totalSales, 'Rs.' + totalOrderAmount, 'Rs.' + totalDiscount, 'Rs.' + totalCouponDiscount]
               )
        
            
      
            doc.table({
                headers: tableHeaders,
                rows: tableData,
                widths: Array(tableHeaders.length).fill('*'), 
                heights: 20,
                headerRows: 1
            });
        } else {
            doc.text('No sales data available.');
        }

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating PDF report' });
    }
}





async function getDailySales() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    return await getOrderData(startOfDay, endOfDay);
}

async function getWeeklySales() {
    const today = new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 });
    const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 });
    return await getOrderData(startOfWeekDate, endOfWeekDate);
}

async function getMonthlySales() {
    const today = new Date();
    const startOfMonthDate = startOfMonth(today);
    const endOfMonthDate = endOfMonth(today);
    return await getOrderData(startOfMonthDate, endOfMonthDate);
}

async function getYearlySales() {
    const today = new Date();
    const startOfYearDate = startOfYear(today);
    const endOfYearDate = endOfYear(today);
    return await getOrderData(startOfYearDate, endOfYearDate);
}

async function getCustomRangeSales(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return await getOrderData(start, end);
}

async function getOrderData(startDate, endDate) {
    try {
        const orders = await Order.find({
            orderDate: { $gte: startDate, $lte: endDate },
        });

        let totalSales = 0;
        let totalOrderAmount = 0;
        let totalDiscount = 0;
        let totalCouponDiscount = 0;

        for (const order of orders) {
            // Calculate total sales by summing up the quantity of ordered items
            totalSales += order.orderedItems.reduce((acc, item) => acc + item.quantity, 0);
            totalOrderAmount += order.totalAmount;

            // Calculate total discount for all products in the order
            for (const item of order.orderedItems) {
                const product = await Product.findById(item.productId);
                if (product) {
                    // Calculate discount for the product
                    const discount = (product.price - product.sellingPrice) * item.quantity;
                    totalDiscount += discount;
                }
            }

            // Add coupon discount to the total coupon discount
            totalCouponDiscount += order.couponDiscount || 0;
        }

        // Fetch all coupons and sum their discount amounts
        const coupons = await Coupon.find({});
        const couponDiscounts = coupons.reduce((acc, coupon) => acc + coupon.discountAmount, 0);

        // Add the sum of coupon discount amounts to the total coupon discount
        totalCouponDiscount += couponDiscounts;

        return [{
            date: startDate,
            totalSales,
            totalOrderAmount,
            totalDiscount,
            totalCouponDiscount
        }];
    } catch (error) {
        console.error("Error in getOrderData:", error);
        throw error; // Throw the error to be caught in the calling function
    }
}

//home chart logic
exports.getDailySalesData = async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7);

        const dailySalesDataToday= await Order.find({
            orderDate: {
                $gte: startOfWeek,
                $lt: endOfWeek
            }
        });

        const dailySalesData = [ ...dailySalesDataToday];
        
     
        res.json(dailySalesData);
    } catch (error) {
        console.error('Error fetching daily sales data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


exports.getMonthlySalesData = async (req, res) => {
    try {
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const monthlySalesData = await Order.find({
            orderDate: {
                $gte: startOfMonth,
                $lt: endOfMonth
            }
        });

        res.json(monthlySalesData);
    } catch (error) {
        console.error('Error fetching monthly sales data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getYearlySalesData = async (req, res) => {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const startOfFirstYear = new Date(currentYear - 4, 0, 1); // Start from 5 years ago
        const endOfCurrentYear = new Date(currentYear + 1, 0, 1); // Up to the start of next year

        const yearlySalesData = await Order.aggregate([
            {
                $match: {
                    orderDate: {
                        $gte: startOfFirstYear,
                        $lt: endOfCurrentYear
                    }
                }
            },
            {
                $group: {
                    _id: { $year: "$orderDate" },
                    salesCount: { $sum: 1 } // Count orders for each year
                }
            },
            {
                $project: {
                    year: "$_id",
                    salesCount: 1,
                    _id: 0
                }
            }
        ]);

        const yearlySalesMap = new Map(yearlySalesData.map(item => [item.year, item.salesCount]));

        // Create an array with sales count for each year (filling zeros for missing years)
        let lastFiveYearsSales = Array.from({ length: 5 }, (_, index) => {
            const year = currentYear - index;
            return yearlySalesMap.has(year) ? yearlySalesMap.get(year) : 0;
        });
        lastFiveYearsSales.reverse()
     
      
        res.json(lastFiveYearsSales);
    } catch (error) {
        console.error('Error fetching yearly sales data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
