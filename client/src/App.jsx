import { useState } from "react";
import Expense from "./components/Expense";
import Payment from "./components/Payment";
import "./App.css";

function App() {
    const [page, setPage] = useState("payments");

    return (
        <div className="app-container">
            <nav className="nav-bar">
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
            </nav>

            <main className="main-content">
                {page === "payments" && <Payment />}
                {page === "expenses" && <Expense />}
            </main>
        </div>
    );
}

export default App;