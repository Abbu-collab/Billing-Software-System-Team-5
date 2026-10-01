const mongoose = require("mongoose");

const getCollection = (name) => {
    return mongoose.connection.collection(name);
};

const getCount = async (collectionName) => {
    try {
        return await getCollection(collectionName).countDocuments();
    } catch (error) {
        return 0;
    }
};

const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return { start, end };
};

const getSalesTotal = async (start, end) => {
    try {
        const result = await getCollection("sales")
            .aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: start,
                            $lte: end
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $ifNull: [
                                    "$totalAmount",
                                    {
                                        $ifNull: [
                                            "$amount",
                                            0
                                        ]
                                    }
                                ]
                            }
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

const getLowStockProducts = async () => {
    try {
        return await getCollection("products").countDocuments({
            $expr: {
                $lte: [
                    "$stock",
                    "$lowStockThreshold"
                ]
            }
        });
    } catch (error) {
        return 0;
    }
};

const getDashboard = async (req, res) => {
    try {
        const { start, end } = getTodayRange();

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
            getSalesTotal(
                new Date(0),
                new Date()
            ),
            getCount("customers"),
            getCount("products"),
            getPendingPayments(),
            getTotalExpenses(),
            getLowStockProducts()
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