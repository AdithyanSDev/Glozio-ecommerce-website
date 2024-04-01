
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

        // Calculate overall totals
        let overallTotalSales = 0;
        let overallTotalOrderAmount = 0;
        let overallTotalDiscount = 0;
        let overallTotalCouponDiscount = 0;

        for (const sale of salesData) {
            overallTotalSales += sale.totalSales;
            overallTotalOrderAmount += sale.totalOrderAmount;
            overallTotalDiscount += sale.totalDiscount;
            overallTotalCouponDiscount += sale.totalCouponDiscount;
        }

        // Overall Sales Table
        const overallSalesTableHeaders = ['Date', 'Total Sales', 'Total Order Amount', 'Total Discount', 'Total Coupon Discount'];
        const overallSalesTableData = [
            ['-', overallTotalSales, 'Rs.' + overallTotalOrderAmount, 'Rs.' + overallTotalDiscount, 'Rs.' + overallTotalCouponDiscount]
        ];
        doc.moveDown().fontSize(16).text('Overall Sales', { align: 'center' }).moveDown(0.5);
        doc.table({
            headers: overallSalesTableHeaders,
            rows: overallSalesTableData,
            widths: Array(overallSalesTableHeaders.length).fill('*'),
            heights: 20,
            headerRows: 1
        });

        // Individual Sales Tables
        for (const sale of salesData) {
            doc.moveDown().fontSize(14).text(`Sales on - ${new Date(sale.date).toLocaleDateString()}`, { align: 'left' }).moveDown(0.5);

            const individualSalesHeaders = ['Product', 'Quantity', 'Price', 'Discount'];
            const individualSalesTableData = sale.individualSales.map(item => [
                item.product.name,
                item.quantity,
                'Rs.' + item.price,
                Math.round(item.discount) + '%'
            ]);

            doc.table({
                headers: individualSalesHeaders,
                rows: individualSalesTableData,
                widths: Array(individualSalesHeaders.length).fill('*'),
                heights: 20,
                headerRows: 1
            });
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
        }).populate({
            path: 'orderedItems.productId',
            select: 'name price discount images'
        });

        let salesData = [];

        for (const order of orders) {
            let individualSales = [];
            let totalOrderAmount = 0;

            for (const item of order.orderedItems) {
                // Calculate total order amount
                totalOrderAmount += item.quantity * item.productId.price;

                // Add individual sale details
                individualSales.push({
                    product: item.productId,
                    quantity: item.quantity,
                    price: item.productId.price,
                    discount: item.productId.discount
                });
            }

            // Calculate total discount
            let totalDiscount = totalOrderAmount - order.totalAmount;

            salesData.push({
                date: order.orderDate,
                totalSales: order.orderedItems.length, // Total number of items in the order
                totalOrderAmount: totalOrderAmount,
                totalDiscount: totalDiscount,
                totalCouponDiscount: order.couponDiscount || 0,
                individualSales: individualSales
            });
        }

        return salesData;
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
