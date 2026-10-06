
const axios = require("axios");
const mongoose = require("mongoose");

const TEAM3_API_URL =
    process.env.TEAM3_API_URL || "http://localhost:5000/api";

const TEAM2_API_URL =
    process.env.TEAM2_API_URL || "http://localhost:5002/api";

const TEAM4_API_URL =
    process.env.TEAM4_API_URL || "http://localhost:5003/api";

const getCollection = (name) => {
    return mongoose.connection.collection(name);
};

// ===============================
// TEAM 3 - CUSTOMER COUNT
// ===============================

const getTeam3CustomerCount = async () => {
    try {
        const response = await axios.get(
            `${TEAM3_API_URL}/customers`
        );

        return response.data?.count || 0;
    } catch (error) {
        console.error(
            "Team 3 customer API error:",
            error.message
        );

        return 0;
    }
};

// ===============================
// TEAM 3 - PURCHASE TOTAL
// ===============================

const getTeam3PurchaseTotal = async () => {
    try {
        const response = await axios.get(
            `${TEAM3_API_URL}/purchases`
        );

        const purchases = response.data?.data || [];

        return purchases.reduce(
            (total, purchase) =>
                total + (Number(purchase.totalAmount) || 0),
            0
        );
    } catch (error) {
        console.error(
            "Team 3 purchase API error:",
            error.message
        );

        return 0;
    }
};

// ===============================
// TEAM 2 - PRODUCTS
// ===============================

const getTeam2Products = async () => {
    try {
        const response = await axios.get(
            `${TEAM2_API_URL}/products`
        );

        return response.data || [];
    } catch (error) {
        console.error(
            "Team 2 product API error:",
            error.message
        );

        return [];
    }
};

// ===============================
// TEAM 2 - PRODUCT COUNT
// ===============================

const getTeam2ProductCount = async () => {
    const products = await getTeam2Products();

    return products.length;
};

// ===============================
// TEAM 2 - LOW STOCK COUNT
// ===============================

const getTeam2LowStockCount = async () => {
    const products = await getTeam2Products();

    return products.filter((product) => {
        const stockQuantity =
            Number(product.stockQuantity) || 0;

        const minimumStock =
            Number(product.minimumStock) || 0;

        return stockQuantity <= minimumStock;
    }).length;
};

// ===============================
// TODAY RANGE
// ===============================

const getTodayRange = () => {
    const start = new Date();

    start.setHours(0, 0, 0, 0);

    const end = new Date();

    end.setHours(23, 59, 59, 999);

    return {
        start,
        end
    };
};

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
// SALES TOTAL
// ===============================

const getSalesTotal = async (start, end) => {
    try {
        const invoices = await getTeam4Invoices();

        return invoices
            .filter((invoice) => {
                const invoiceDate = new Date(
                    invoice.invoiceDate
                );

                return (
                    invoiceDate >= start &&
                    invoiceDate <= end
                );
            })
            .reduce(
                (total, invoice) =>
                    total +
                    (Number(invoice.grandTotal) || 0),
                0
            );
    } catch (error) {
        console.error(
            "Sales calculation error:",
            error.message
        );

        return 0;
    }
};

// ===============================
// TOTAL EXPENSES
// ===============================

const getTotalExpenses = async () => {
    try {
        const result = await getCollection("expenses")
            .aggregate([
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

        return result[0]?.total || 0;
    } catch (error) {
        return 0;
    }
};

// ===============================
// PENDING PAYMENTS
// ===============================

const getPendingPayments = async () => {
    try {
        const result = await getCollection("payments")
            .aggregate([
                {
                    $match: {
                        status: {
                            $in: [
                                "PENDING",
                                "PARTIALLY_PAID"
                            ]
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

        return result[0]?.total || 0;
    } catch (error) {
        return 0;
    }
};

// ===============================
// DASHBOARD
// ===============================

const getDashboard = async (req, res) => {
    try {
        const {
            start,
            end
        } = getTodayRange();

        const [
            todaySales,
            totalSales,
            totalPurchases,
            totalCustomers,
            totalProducts,
            pendingPayments,
            totalExpenses,
            lowStockProducts
        ] = await Promise.all([
            getSalesTotal(start, end),

            getSalesTotal(
                new Date(0),
                new Date()
            ),

            getTeam3PurchaseTotal(),

            getTeam3CustomerCount(),

            getTeam2ProductCount(),

            getPendingPayments(),

            getTotalExpenses(),

            getTeam2LowStockCount()
        ]);

        res.status(200).json({
            success: true,
            data: {
                todaySales,
                totalSales,
                totalPurchases,
                totalCustomers,
                totalProducts,
                pendingPayments,
                totalExpenses,
                lowStockProducts
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
    getDashboard
};