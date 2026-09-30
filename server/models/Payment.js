const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        invoice: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice"
        },

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer"
        },

        amount: {
            type: Number,
            required: true,
            min: 0.01
        },

        paymentMethod: {
            type: String,
            required: true,
            trim: true
        },

        paymentDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            required: true,
            enum: [
                "PAID",
                "PARTIALLY_PAID",
                "PENDING"
            ]
        },

        transactionReference: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);