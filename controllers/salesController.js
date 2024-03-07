
const { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } = require('date-fns');

const PDFDocument = require('pdfkit');
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

        switch (filterType) {
            case 'daily':
                salesData = await getDailySales();
                reportTitle = 'Today';
                break;
            case 'weekly':
                salesData = await getWeeklySales();
                reportTitle = 'This Week';
                break;
            case 'monthly':
                salesData = await getMonthlySales();
                reportTitle = 'This Month';
                break;
            case 'yearly':
                salesData = await getYearlySales();
                reportTitle = 'This Year';
                break;
            case 'custom':
                if (!startDate || !endDate) {
                    throw new Error('Custom date range requires both start date and end date.');
                }
                salesData = await getCustomRangeSales(startDate, endDate);
                reportTitle = `${startDate} to ${endDate}`;
                break;
            default:
                throw new Error('Invalid filter type.');
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=sales_report.pdf');
        doc.pipe(res);

        doc.image('public/img/Gloziologo.png', {
            width: 25,
            align: 'center'
        }).moveDown(0.5); // Move down a bit to create space between the logo and the text
        doc.fontSize(20).text('GLOZIO', { align: 'left' });
    // Report title
    doc.fontSize(18).text('Sales report', { align: 'center' });
    doc.moveDown();

    // Sales data
    salesData.forEach(({ date, totalSales, totalOrderAmount, totalDiscount, totalCouponDiscount }) => {
        doc.fontSize(14).text(`Date: ${date}`);
        doc.fontSize(12).text(`Total Sales: ${totalSales}`);
        doc.fontSize(12).text(`Total Order Amount: Rs.${totalOrderAmount}`);
        doc.fontSize(12).text(`Total Discount: Rs.${totalDiscount}`);
        doc.fontSize(12).text(`Total Coupon Discount: Rs.${totalCouponDiscount}`);
        doc.moveDown();
    });
       

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

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

        orders.forEach(order => {
            // Calculate total sales by summing up the quantity of ordered items
            totalSales += order.orderedItems.reduce((acc, item) => acc + item.quantity, 0);
            totalOrderAmount += order.totalAmount;
            totalDiscount += order.totalDiscount || 0;
            totalCouponDiscount += order.couponDiscount || 0;
        });

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
