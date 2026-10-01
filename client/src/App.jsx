import { useState } from "react";
import Expense from "./components/Expense";
import Payment from "./components/Payment";
import Dashboard from "./components/Dashboard";
import Reports from "./components/Reports";
import "./App.css";

function App() {
    const [page, setPage] = useState("dashboard");

    return (
        <div className="app-container">
            <nav className="nav-bar">
                <button
                    type="button"
                    className={`nav-btn ${page === "dashboard" ? "active" : ""}`}
                    onClick={() => setPage("dashboard")}
                >
                    Dashboard
                </button>
                <button
                    type="button"
                    className={`nav-btn ${page === "payments" ? "active" : ""}`}
                    onClick={() => setPage("payments")}
                >
                    Payments
                </button>
                <button
                    type="button"
                    className={`nav-btn ${page === "expenses" ? "active" : ""}`}
                    onClick={() => setPage("expenses")}
                >
                    Expenses
                </button>
                <button
                    type="button"
                    className={`nav-btn ${page === "reports" ? "active" : ""}`}
                    onClick={() => setPage("reports")}
                >
                    Reports
                </button>
            </nav>

            <main className="main-content">
                {page === "dashboard" && <Dashboard />}
                {page === "payments" && <Payment />}
                {page === "expenses" && <Expense />}
                {page === "reports" && <Reports />}
            </main>
        </div>
    );
}

export default App;