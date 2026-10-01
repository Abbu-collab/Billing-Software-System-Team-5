import { useState, useCallback } from "react";
import "./Reports.css";

const BASE_URL = "http://localhost:5000/api/reports";

const PERIODS = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
];

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
    }).format(value ?? 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN").format(value ?? 0);
}

function buildUrl(endpoint, period, startDate, endDate) {
    const params = new URLSearchParams({ period });
    if (period === "custom") {
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
    }
    return `${BASE_URL}/${endpoint}?${params.toString()}`;
}

function SectionError({ message, onRetry }) {
    return (
        <div className="report-section-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{message}</span>
            {onRetry && (
                <button type="button" className="retry-btn-small" onClick={onRetry}>
                    Retry
                </button>
            )}
        </div>
    );
}

function SectionSkeleton({ rows = 2 }) {
    return (
        <div className="report-skeleton">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="report-skeleton-row" aria-hidden="true" />
            ))}
        </div>
    );
}

function Reports() {
    const [period, setPeriod] = useState("today");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [salesData, setSalesData] = useState(null);
    const [salesLoading, setSalesLoading] = useState(false);
    const [salesError, setSalesError] = useState("");

    const [purchaseData, setPurchaseData] = useState(null);
    const [purchaseLoading, setPurchaseLoading] = useState(false);
    const [purchaseError, setPurchaseError] = useState("");

    const [expenseData, setExpenseData] = useState(null);
    const [expenseLoading, setExpenseLoading] = useState(false);
    const [expenseError, setExpenseError] = useState("");

    const [profitData, setProfitData] = useState(null);
    const [profitLoading, setProfitLoading] = useState(false);
    const [profitError, setProfitError] = useState("");

    const [hasSearched, setHasSearched] = useState(false);

    const fetchReport = useCallback(
        async (endpoint, setData, setLoading, setError) => {
            setLoading(true);
            setError("");
            setData(null);
            try {
                const url = buildUrl(endpoint, period, startDate, endDate);
                const response = await fetch(url);
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || `Failed to fetch ${endpoint} report`);
                }
                if (!result.success) {
                    throw new Error(result.message || "API returned an error");
                }
                setData(result.data);
            } catch (err) {
                setError(err.message || `Failed to load ${endpoint} report`);
            } finally {
                setLoading(false);
            }
        },
        [period, startDate, endDate]
    );

    const handleGenerate = useCallback(() => {
        if (period === "custom") {
            if (!startDate || !endDate) return;
            if (startDate > endDate) return;
        }
        setHasSearched(true);
        fetchReport("sales", setSalesData, setSalesLoading, setSalesError);
        fetchReport("purchases", setPurchaseData, setPurchaseLoading, setPurchaseError);
        fetchReport("expenses", setExpenseData, setExpenseLoading, setExpenseError);
        fetchReport("profit", setProfitData, setProfitLoading, setProfitError);
    }, [period, startDate, endDate, fetchReport]);

    const isCustomInvalid =
        period === "custom" && (!startDate || !endDate || startDate > endDate);

    const anyLoading =
        salesLoading || purchaseLoading || expenseLoading || profitLoading;

    return (
        <div className="reports-page">
            <div className="reports-header">
                <h1>Reports</h1>
                <p>Generate and review financial reports by period</p>
            </div>

            {/* Filter Card */}
            <div className="reports-filter-card">
                <div className="reports-filter-card-header">
                    <h2>Report Filters</h2>
                    <p>Select a time period to generate the report</p>
                </div>

                <div className="reports-filter-form">
                    <div className="filter-group">
                        <label htmlFor="rpt-period">Period</label>
                        <div className="period-tabs" role="group" aria-label="Report period">
                            {PERIODS.map((p) => (
                                <button
                                    key={p.value}
                                    type="button"
                                    id={p.value === period ? "rpt-period" : undefined}
                                    className={"period-tab" + (period === p.value ? " active" : "")}
                                    onClick={() => {
                                        setPeriod(p.value);
                                        setHasSearched(false);
                                    }}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {period === "custom" && (
                        <div className="filter-date-row">
                            <div className="filter-group">
                                <label htmlFor="rpt-start">Start Date</label>
                                <input
                                    id="rpt-start"
                                    type="date"
                                    className="filter-input"
                                    value={startDate}
                                    max={endDate || undefined}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="filter-group">
                                <label htmlFor="rpt-end">End Date</label>
                                <input
                                    id="rpt-end"
                                    type="date"
                                    className="filter-input"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {isCustomInvalid && (
                        <p className="filter-warning">
                            Please select a valid start and end date (start must be before end).
                        </p>
                    )}

                    <div className="filter-actions">
                        <button
                            id="rpt-generate-btn"
                            type="button"
                            className="primary-button"
                            onClick={handleGenerate}
                            disabled={isCustomInvalid || anyLoading}
                        >
                            {anyLoading ? "Loading..." : "Generate Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Report Sections */}
            {hasSearched && (
                <div className="reports-sections">

                    {/* Sales Report */}
                    <div className="report-card">
                        <div className="report-card-header report-card-header-primary">
                            <div className="report-card-title-row">
                                <div className="report-card-icon report-icon-primary">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                        <polyline points="17 6 23 6 23 12" />
                                    </svg>
                                </div>
                                <div>
                                    <h2>Sales Report</h2>
                                    <p>Revenue from sales transactions</p>
                                </div>
                            </div>
                        </div>
                        <div className="report-card-body">
                            {salesLoading && <SectionSkeleton rows={2} />}
                            {salesError && (
                                <SectionError
                                    message={salesError}
                                    onRetry={() =>
                                        fetchReport("sales", setSalesData, setSalesLoading, setSalesError)
                                    }
                                />
                            )}
                            {salesData && (
                                <div className="report-stat-grid">
                                    <div className="report-stat">
                                        <span className="report-stat-label">Total Sales</span>
                                        <span className="report-stat-value report-value-primary">
                                            {formatCurrency(salesData.totalSales)}
                                        </span>
                                    </div>
                                    <div className="report-stat">
                                        <span className="report-stat-label">Number of Sales</span>
                                        <span className="report-stat-value">
                                            {formatNumber(salesData.numberOfSales)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Purchase Report */}
                    <div className="report-card">
                        <div className="report-card-header report-card-header-info">
                            <div className="report-card-title-row">
                                <div className="report-card-icon report-icon-info">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="9" cy="21" r="1" />
                                        <circle cx="20" cy="21" r="1" />
                                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h2>Purchase Report</h2>
                                    <p>Costs from purchase transactions</p>
                                </div>
                            </div>
                        </div>
                        <div className="report-card-body">
                            {purchaseLoading && <SectionSkeleton rows={2} />}
                            {purchaseError && (
                                <SectionError
                                    message={purchaseError}
                                    onRetry={() =>
                                        fetchReport("purchases", setPurchaseData, setPurchaseLoading, setPurchaseError)
                                    }
                                />
                            )}
                            {purchaseData && (
                                <div className="report-stat-grid">
                                    <div className="report-stat">
                                        <span className="report-stat-label">Total Purchases</span>
                                        <span className="report-stat-value report-value-info">
                                            {formatCurrency(purchaseData.totalPurchases)}
                                        </span>
                                    </div>
                                    <div className="report-stat">
                                        <span className="report-stat-label">Number of Purchases</span>
                                        <span className="report-stat-value">
                                            {formatNumber(purchaseData.numberOfPurchases)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expense Report */}
                    <div className="report-card">
                        <div className="report-card-header report-card-header-warning">
                            <div className="report-card-title-row">
                                <div className="report-card-icon report-icon-warning">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                </div>
                                <div>
                                    <h2>Expense Report</h2>
                                    <p>Breakdown of expenses by category</p>
                                </div>
                            </div>
                        </div>
                        <div className="report-card-body">
                            {expenseLoading && <SectionSkeleton rows={3} />}
                            {expenseError && (
                                <SectionError
                                    message={expenseError}
                                    onRetry={() =>
                                        fetchReport("expenses", setExpenseData, setExpenseLoading, setExpenseError)
                                    }
                                />
                            )}
                            {expenseData && (
                                <div>
                                    <div className="report-stat-grid">
                                        <div className="report-stat">
                                            <span className="report-stat-label">Total Expenses</span>
                                            <span className="report-stat-value report-value-warning">
                                                {formatCurrency(expenseData.totalExpenses)}
                                            </span>
                                        </div>
                                    </div>

                                    {expenseData.expensesByCategory &&
                                        expenseData.expensesByCategory.length > 0 && (
                                            <div className="report-category-section">
                                                <h3 className="report-category-title">By Category</h3>
                                                <div className="report-table-wrapper">
                                                    <table className="report-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Category</th>
                                                                <th className="text-right">Total</th>
                                                                <th className="text-right">Count</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {expenseData.expensesByCategory.map((cat, idx) => (
                                                                <tr key={idx}>
                                                                    <td>{cat.category || cat._id || "Uncategorized"}</td>
                                                                    <td className="text-right">
                                                                        {formatCurrency(cat.total ?? cat.totalAmount)}
                                                                    </td>
                                                                    <td className="text-right">
                                                                        {formatNumber(cat.count ?? cat.numberOfExpenses)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                    {expenseData.expensesByCategory &&
                                        expenseData.expensesByCategory.length === 0 && (
                                            <p className="report-empty-note">
                                                No expense categories found for this period.
                                            </p>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profit Report */}
                    <div className="report-card">
                        <div className="report-card-header report-card-header-success">
                            <div className="report-card-title-row">
                                <div className="report-card-icon report-icon-success">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="1" x2="12" y2="23" />
                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h2>Profit Report</h2>
                                    <p>Net profit calculation for the period</p>
                                </div>
                            </div>
                        </div>
                        <div className="report-card-body">
                            {profitLoading && <SectionSkeleton rows={4} />}
                            {profitError && (
                                <SectionError
                                    message={profitError}
                                    onRetry={() =>
                                        fetchReport("profit", setProfitData, setProfitLoading, setProfitError)
                                    }
                                />
                            )}
                            {profitData && (
                                <div className="profit-breakdown">
                                    <div className="profit-row">
                                        <div className="profit-row-label">
                                            <span className="profit-row-dot profit-dot-success" />
                                            Sales Revenue
                                        </div>
                                        <span className="profit-row-value profit-row-value-success">
                                            {formatCurrency(profitData.salesRevenue)}
                                        </span>
                                    </div>
                                    <div className="profit-row">
                                        <div className="profit-row-label">
                                            <span className="profit-row-dot profit-dot-info" />
                                            Purchase Cost
                                        </div>
                                        <span className="profit-row-value profit-row-value-negative">
                                            &minus; {formatCurrency(profitData.purchaseCost)}
                                        </span>
                                    </div>
                                    <div className="profit-row">
                                        <div className="profit-row-label">
                                            <span className="profit-row-dot profit-dot-warning" />
                                            Expenses
                                        </div>
                                        <span className="profit-row-value profit-row-value-negative">
                                            &minus; {formatCurrency(profitData.expenses)}
                                        </span>
                                    </div>
                                    <div className="profit-divider" />
                                    <div className="profit-row profit-row-total">
                                        <div className="profit-row-label">
                                            Net Profit
                                        </div>
                                        <span className={"profit-row-value profit-total-value " +
                                            ((profitData.profit ?? 0) >= 0
                                                ? "profit-row-value-success"
                                                : "profit-row-value-negative")}>
                                            {formatCurrency(profitData.profit)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}

            {!hasSearched && (
                <div className="reports-prompt">
                    <div className="reports-prompt-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </div>
                    <p>Select a period and click <strong>Generate Report</strong> to view financial data.</p>
                </div>
            )}
        </div>
    );
}

export default Reports;
