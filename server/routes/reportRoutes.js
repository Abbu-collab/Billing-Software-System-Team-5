const express = require("express");

const {
    getSalesReport,
    getPurchaseReport,
    getExpenseReport,
    getProfitReport
} = require("../controllers/reportController");

const router = express.Router();

router.get("/sales", getSalesReport);
router.get("/purchases", getPurchaseReport);
router.get("/expenses", getExpenseReport);
router.get("/profit", getProfitReport);

module.exports = router;