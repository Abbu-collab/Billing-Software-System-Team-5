const express = require("express");
const cors = require("cors");
const expenseRoutes = require("./routes/expenseRoutes");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Team 5 Billing Software API is running"
    });
});
app.use("/api/expenses", expenseRoutes);
module.exports = app;