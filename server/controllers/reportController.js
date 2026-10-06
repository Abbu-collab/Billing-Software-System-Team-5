
const axios = require("axios");
const mongoose = require("mongoose");

const TEAM3_API_URL =
    process.env.TEAM3_API_URL || "http://localhost:5000/api";

const TEAM4_API_URL =
    process.env.TEAM4_API_URL || "http://localhost:5003/api";

const getCollection = (name) => {
    return mongoose.connection.collection(name);
};


// ===============================
// Date Range
// ===============================

const getDateRange = (period, startDate, endDate) => {
    const now = new Date();

    let start;
    let end = new Date();

    if (period === "today") {
        start = new Date();
        start.setHours(0, 0, 0, 0);

    } else if (period === "week") {
        start = new Date();
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);

    } else if (period === "month") {
        start = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

    } else if (period === "custom") {

        if (!startDate || !endDate) {
            return null;
        }

        start = new Date(startDate);
        end = new Date(endDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime())
        ) {
            return null;
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

    } else {
        start = new Date(0);
    }

    return {
        start,
        end
    };
};


// ===============================
// Team 4 - Get Invoices
// ===============================

const getTeam4Invoices = async () => {
    try {
        const response = await axios.get(
            `${TEAM4_API_URL}/invoices`
        );

        return Array.isArray(response.data)
            ? response.data
            : [];

    } catch (error) {

        console.error(
            "Team 4 invoice API error:",
            error.message
        );

        return [];
    }
};


// ===============================
// Filter Team 4 Invoices
// ===============================

const getFilteredTeam4Invoices = async (start, end) => {

    const invoices = await getTeam4Invoices();

    return invoices.filter((invoice) => {

        const invoiceDate = new Date(
            invoice.invoiceDate
        );

        return (
            invoiceDate >= start &&
            invoiceDate <= end
        );
    });
};


// ===============================
// Team 3 - Get Purchases
// ===============================

const getTeam3Purchases = async () => {
    try {

        const response = await axios.get(
            `${TEAM3_API_URL}/purchases`
        );

        return response.data?.data || [];

    } catch (error) {

        console.error(
            "Team 3 purchase API error:",
            error.message
        );

        return [];
    }
};


// ===============================
// Filter Purchases
// ===============================

const getFilteredTeam3Purchases = async (start, end) => {

    const purchases = await getTeam3Purchases();

    return purchases.filter((purchase) => {

        const purchaseDate = new Date(
            purchase.purchaseDate
        );

        return (
            purchaseDate >= start &&
            purchaseDate <= end
        );
    });
};


// ===============================
// SALES REPORT
// ===============================

const getSalesReport = async (req, res) => {

    try {

        const {
            period = "today",
            startDate,
            endDate
        } = req.query;

        const range = getDateRange(
            period,
            startDate,
            endDate
        );

        if (!range) {

            return res.status(400).json({
                success: false,
                message:
                    "startDate and endDate are required for custom period"
            });
        }


        const invoices =
            await getFilteredTeam4Invoices(
                range.start,
                range.end
            );


        const totalSales = invoices.reduce(
            (total, invoice) =>
                total +
                (Number(invoice.grandTotal) || 0),
            0
        );


        res.status(200).json({

            success: true,

            period,

            data: {

                totalSales,

                numberOfSales:
                    invoices.length

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }
};


// ===============================
// PURCHASE REPORT
// ===============================

const getPurchaseReport = async (req, res) => {

    try {

        const {
            period = "today",
            startDate,
            endDate
        } = req.query;


        const range = getDateRange(
            period,
            startDate,
            endDate
        );


        if (!range) {

            return res.status(400).json({

                success: false,

                message:
                    "startDate and endDate are required for custom period"

            });

        }


        const purchases =
            await getFilteredTeam3Purchases(
                range.start,
                range.end
            );


        const totalPurchases =
            purchases.reduce(
                (total, purchase) =>
                    total +
                    (Number(purchase.totalAmount) || 0),
                0
            );


        res.status(200).json({

            success: true,

            period,

            data: {

                totalPurchases,

                numberOfPurchases:
                    purchases.length

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }
};


// ===============================
// EXPENSE REPORT
// ===============================

const getExpenseReport = async (req, res) => {

    try {

        const {
            period = "today",
            startDate,
            endDate
        } = req.query;


        const range = getDateRange(
            period,
            startDate,
            endDate
        );


        if (!range) {

            return res.status(400).json({

                success: false,

                message:
                    "startDate and endDate are required for custom period"

            });

        }


        const data =
            await getCollection("expenses")
                .aggregate([

                    {
                        $match: {

                            date: {

                                $gte: range.start,

                                $lte: range.end

                            }

                        }

                    },

                    {
                        $group: {

                            _id: "$category",

                            totalAmount: {

                                $sum: "$amount"

                            }

                        }

                    },

                    {
                        $sort: {

                            totalAmount: -1

                        }

                    }

                ])
                .toArray();


        const totalExpenses =
            data.reduce(
                (total, item) =>
                    total +
                    (Number(item.totalAmount) || 0),
                0
            );


        res.status(200).json({

            success: true,

            period,

            data: {

                totalExpenses,

                expensesByCategory:
                    data

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }
};


// ===============================
// PROFIT REPORT
// ===============================

const getProfitReport = async (req, res) => {

    try {

        const {
            period = "today",
            startDate,
            endDate
        } = req.query;


        const range = getDateRange(
            period,
            startDate,
            endDate
        );


        if (!range) {

            return res.status(400).json({

                success: false,

                message:
                    "startDate and endDate are required for custom period"

            });

        }


        // Get Team 4 Sales

        const invoices =
            await getFilteredTeam4Invoices(
                range.start,
                range.end
            );


        const salesRevenue =
            invoices.reduce(
                (total, invoice) =>
                    total +
                    (Number(invoice.grandTotal) || 0),
                0
            );


        // Get Team 3 Purchases

        const purchases =
            await getFilteredTeam3Purchases(
                range.start,
                range.end
            );


        const purchaseCost =
            purchases.reduce(
                (total, purchase) =>
                    total +
                    (Number(purchase.totalAmount) || 0),
                0
            );


        // Get Team 5 Expenses

        const expenseData =
            await getCollection("expenses")
                .aggregate([

                    {
                        $match: {

                            date: {

                                $gte: range.start,

                                $lte: range.end

                            }

                        }

                    },

                    {
                        $group: {

                            _id: null,

                            total: {

                                $sum: "$amount"

                            }

                        }

                    }

                ])
                .toArray();


        const expenses =
            expenseData[0]?.total || 0;


        // Calculate Profit

        const profit =
            salesRevenue -
            purchaseCost -
            expenses;


        res.status(200).json({

            success: true,

            period,

            data: {

                salesRevenue,

                purchaseCost,

                expenses,

                profit

            }

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }
};


module.exports = {

    getSalesReport,

    getPurchaseReport,

    getExpenseReport,

    getProfitReport

};