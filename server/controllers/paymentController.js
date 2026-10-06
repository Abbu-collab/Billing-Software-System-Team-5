const axios = require("axios");
const Payment = require("../models/Payment");

const TEAM4_API_URL =
    process.env.TEAM4_API_URL || "http://localhost:5003/api";

// Get invoices from Team 4
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

        throw new Error(
            "Unable to fetch invoice details"
        );
    }
};

// Get one invoice by ID
const getInvoiceById = async (invoiceId) => {
    try {
        const response = await axios.get(
            `${TEAM4_API_URL}/invoices/${invoiceId}`
        );

        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }

        throw new Error(
            "Unable to fetch invoice details"
        );
    }
};


// ===============================
// Create Payment
// ===============================

const createPayment = async (req, res) => {
    try {
        const {
            invoice,
            customer,
            amount,
            paymentMethod,
            paymentDate,
            transactionReference
        } = req.body;


        // Validate invoice
        if (!invoice) {
            return res.status(400).json({
                success: false,
                message: "Invoice is required"
            });
        }


        // Validate amount
        if (
            amount === undefined ||
            amount === null ||
            Number(amount) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount must be greater than 0"
            });
        }


        // Validate payment method
        if (!paymentMethod) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment method is required"
            });
        }


        // Validate payment date
        if (!paymentDate) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment date is required"
            });
        }


        // Get invoice from Team 4
        const invoiceData =
            await getInvoiceById(invoice);


        if (!invoiceData) {
            return res.status(404).json({
                success: false,
                message: "Invoice not found"
            });
        }


        const invoiceAmount =
            Number(invoiceData.grandTotal) || 0;


        // Get previous payments for this invoice
        const previousPayments =
            await Payment.find({
                invoice
            });


        const totalPreviouslyPaid =
            previousPayments.reduce(
                (total, payment) =>
                    total +
                    (Number(payment.amount) || 0),
                0
            );


        // Calculate remaining amount
        const remainingBeforePayment =
            invoiceAmount -
            totalPreviouslyPaid;


        // Check if invoice is already fully paid
        if (remainingBeforePayment <= 0) {
            return res.status(400).json({
                success: false,
                message:
                    "This invoice is already fully paid",
                remainingAmount: 0
            });
        }


        // Payment cannot exceed remaining amount
        if (
            Number(amount) >
            remainingBeforePayment
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Payment amount cannot exceed the remaining invoice amount",
                invoiceAmount,
                totalPreviouslyPaid,
                remainingAmount:
                    remainingBeforePayment
            });
        }


        // Calculate payment status
        const totalPaidAfterPayment =
            totalPreviouslyPaid +
            Number(amount);


        let status;

        if (
            totalPaidAfterPayment >=
            invoiceAmount
        ) {
            status = "PAID";
        } else {
            status = "PARTIALLY_PAID";
        }


        // Create payment
        const payment = await Payment.create({
            invoice,
            customer,
            amount: Number(amount),
            paymentMethod,
            paymentDate,
            status,
            transactionReference
        });


        const remainingAmount =
            invoiceAmount -
            totalPaidAfterPayment;


        res.status(201).json({
            success: true,
            message:
                "Payment created successfully",

            data: payment,

            paymentSummary: {
                invoiceAmount,
                totalPreviouslyPaid,
                paymentAmount: Number(amount),
                totalPaid:
                    totalPaidAfterPayment,
                remainingAmount,
                status
            }
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ===============================
// Get All Payments
// ===============================

const getPayments = async (req, res) => {
    try {

        const payments =
            await Payment.find()
                .sort({
                    paymentDate: -1
                });

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


// ===============================
// Get Payment By ID
// ===============================

const getPaymentById = async (req, res) => {
    try {

        const payment =
            await Payment.findById(
                req.params.id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            data: payment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message:
                "Invalid payment ID"
        });

    }
};


// ===============================
// Update Payment
// ===============================

const updatePayment = async (req, res) => {
    try {

        const payment =
            await Payment.findById(
                req.params.id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment not found"
            });
        }


        // For now, do not allow changing
        // invoice or amount through update.
        // This prevents breaking the payment calculation.

        const allowedUpdates = {
            paymentMethod:
                req.body.paymentMethod,
            paymentDate:
                req.body.paymentDate,
            transactionReference:
                req.body.transactionReference
        };


        if (
            allowedUpdates.paymentMethod !==
            undefined
        ) {
            payment.paymentMethod =
                allowedUpdates.paymentMethod;
        }


        if (
            allowedUpdates.paymentDate !==
            undefined
        ) {
            payment.paymentDate =
                allowedUpdates.paymentDate;
        }


        if (
            allowedUpdates.transactionReference !==
            undefined
        ) {
            payment.transactionReference =
                allowedUpdates.transactionReference;
        }


        await payment.save();


        res.status(200).json({
            success: true,
            message:
                "Payment updated successfully",
            data: payment
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message
        });

    }
};


// ===============================
// Delete Payment
// ===============================

const deletePayment = async (req, res) => {
    try {

        const payment =
            await Payment.findByIdAndDelete(
                req.params.id
            );

        if (!payment) {
            return res.status(404).json({
                success: false,
                message:
                    "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            message:
                "Payment deleted successfully"
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message:
                "Invalid payment ID"
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