const Payment = require("../models/Payment");

// Create Payment
const createPayment = async (req, res) => {
    try {
        const {
            invoice,
            customer,
            amount,
            paymentMethod,
            paymentDate,
            status,
            transactionReference
        } = req.body;

        if (amount === undefined || amount === null || amount < 0) {
            return res.status(400).json({
                success: false,
                message: "Payment amount must be a non-negative value"
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message: "Payment method is required"
            });
        }

        if (!paymentDate) {
            return res.status(400).json({
                success: false,
                message: "Payment date is required"
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Payment status is required"
            });
        }

        const payment = await Payment.create({
            invoice,
            customer,
            amount,
            paymentMethod,
            paymentDate,
            status,
            transactionReference
        });

        res.status(201).json({
            success: true,
            message: "Payment created successfully",
            data: payment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Payments
const getPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .sort({ paymentDate: -1 });

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Payment By ID
const getPaymentById = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            data: payment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid payment ID"
        });
    }
};

// Update Payment
const updatePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment updated successfully",
            data: payment
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Payment
const deletePayment = async (req, res) => {
    try {
        const payment = await Payment.findByIdAndDelete(
            req.params.id
        );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Payment deleted successfully"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid payment ID"
        });
    }
};

module.exports = {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    deletePayment
};