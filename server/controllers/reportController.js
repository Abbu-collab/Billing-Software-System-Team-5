const mongoose = require("mongoose");

const getCollection = (name) => {
    return mongoose.connection.collection(name);
};

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

        const data = await getCollection("sales")
            .aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: range.start,
                            $lte: range.end
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSales: {
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
                        },
                        numberOfSales: {
                            $sum: 1
                        }
                    }
                }
            ])
            .toArray();

        res.status(200).json({
            success: true,
            period,
            data: {
                totalSales:
                    data[0]?.totalSales || 0,
                numberOfSales:
                    data[0]?.numberOfSales || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

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

        const data = await getCollection("purchases")
            .aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: range.start,
                            $lte: range.end
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalPurchases: {
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
                        },
                        numberOfPurchases: {
                            $sum: 1
                        }
                    }
                }
            ])
            .toArray();

        res.status(200).json({
            success: true,
            period,
            data: {
                totalPurchases:
                    data[0]?.totalPurchases || 0,
                numberOfPurchases:
                    data[0]?.numberOfPurchases || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

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

        const data = await getCollection("expenses")
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

        const totalExpenses = data.reduce(
            (total, item) =>
                total + item.totalAmount,
            0
        );

        res.status(200).json({
            success: true,
            period,
            data: {
                totalExpenses,
                expensesByCategory: data
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

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

        const salesData = await getCollection("sales")
            .aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: range.start,
                            $lte: range.end
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

        const purchaseData =
            await getCollection("purchases")
                .aggregate([
                    {
                        $match: {
                            createdAt: {
                                $gte: range.start,
                                $lte: range.end
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

        const salesRevenue =
            salesData[0]?.total || 0;

        const purchaseCost =
            purchaseData[0]?.total || 0;

        const expenses =
            expenseData[0]?.total || 0;

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