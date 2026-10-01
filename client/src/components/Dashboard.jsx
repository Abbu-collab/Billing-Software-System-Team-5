import { useEffect, useState, useCallback } from "react";
import "./Dashboard.css";

const API_URL = "http://localhost:5000/api/dashboard";

const METRICS = [
    {
        key: "todaySales",
        label: "Today's Sales",
        format: "currency",
        colorClass: "metric-primary",
    },
    {
        key: "totalSales",
        label: "Total Sales",
        format: "currency",
        colorClass: "metric-success",
    },
    {
        key: "totalPurchases",
        label: "Total Purchases",
        format: "currency",
        colorClass: "metric-info",
    },
    {
        key: "totalCustomers",
        label: "Total Customers",
        format: "number",
        colorClass: "metric-warning",
    },
    {
        key: "totalProducts",
        label: "Total Products",
        format: "number",
        colorClass: "metric-primary",
    },
    {
        key: "pendingPayments",
        label: "Pending Payments",
        format: "number",
        colorClass: "metric-danger",
    },
    {
        key: "totalExpenses",
        label: "Total Expenses",
        format: "currency",
        colorClass: "metric-warning",
    },
    {
        key: "lowStockProducts",
        label: "Low Stock Products",
        format: "number",
        colorClass: "metric-danger",
    },
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

function MetricIcon({ metricKey }) {
    const icons = {
        todaySales: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
            </svg>
        ),
        totalSales: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
        ),
        totalPurchases: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
        ),
        totalCustomers: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
        ),
        totalProducts: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
        ),
        pendingPayments: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
            </svg>
        ),
        totalExpenses: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
        ),
        lowStockProducts: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
    };
    return icons[metricKey] || null;
}

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(API_URL);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to fetch dashboard data");
            }

            if (!result.success) {
                throw new Error(result.message || "API returned an error");
            }

            setData(result.data);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err.message || "Failed to load dashboard data. Please check that the server is running.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div className="dashboard-header-text">
                    <h1>Dashboard</h1>
                    <p>Overview of your billing system performance</p>
                </div>
                <button
                    type="button"
                    className="dashboard-refresh-btn"
                    onClick={fetchDashboard}
                    disabled={loading}
                    aria-label="Refresh dashboard"
                >
                    <svg
                        className={loading ? "spin" : ""}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="23 4 23 10 17 10" />
                        <polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {lastUpdated && !loading && (
                <p className="dashboard-timestamp">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
            )}

            {error && (
                <div className="dashboard-error" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                    <button type="button" className="error-retry-btn" onClick={fetchDashboard}>
                        Retry
                    </button>
                </div>
            )}

            {loading && !data && (
                <div className="dashboard-loading" aria-live="polite">
                    <div className="dashboard-skeleton-grid">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="skeleton-card" aria-hidden="true" />
                        ))}
                    </div>
                </div>
            )}

            {data && (
                <div className="dashboard-metrics-grid">
                    {METRICS.map((metric) => (
                        <div
                            key={metric.key}
                            className={"metric-card " + metric.colorClass}
                        >
                            <div className="metric-icon">
                                <MetricIcon metricKey={metric.key} />
                            </div>
                            <div className="metric-body">
                                <span className="metric-label">{metric.label}</span>
                                <span className="metric-value">
                                    {metric.format === "currency"
                                        ? formatCurrency(data[metric.key])
                                        : formatNumber(data[metric.key])}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
