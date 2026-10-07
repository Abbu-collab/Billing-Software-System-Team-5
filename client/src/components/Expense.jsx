import { useEffect, useState, useMemo } from "react";
import "./Expense.css";

const API_URL = "http://localhost:5001/api/expenses";

const categories = [
    "Rent",
    "Electricity",
    "Transport",
    "Salary",
    "Maintenance",
    "Office Supplies",
    "Other"
];

const categoryColors = {
    Rent: { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe" },
    Electricity: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
    Transport: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" },
    Salary: { bg: "#dcfce7", text: "#15803d", border: "#bbf7d0" },
    Maintenance: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
    "Office Supplies": { bg: "#ccfbf1", text: "#0f766e", border: "#99f6e4" },
    Other: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" }
};

const initialForm = {
    category: "",
    amount: "",
    date: "",
    description: ""
};

function Expense() {
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("ALL");

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        if (!message && !error) {
            return;
        }

        const timer = setTimeout(() => {
            setMessage("");
            setError("");
        }, 3500);

        return () => clearTimeout(timer);
    }, [message, error]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);

            const response = await fetch(API_URL);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to fetch expenses");
            }

            setExpenses(result.data || []);
        } catch (err) {
            setError(err.message || "Failed to load expenses");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!form.category) {
            setError("Please select an expense category.");
            return;
        }

        if (!form.amount || Number(form.amount) < 0) {
            setError("Please enter a valid amount.");
            return;
        }

        if (!form.date) {
            setError("Please select a date.");
            return;
        }

        try {
            setLoading(true);

            const url = editingId
                ? `${API_URL}/${editingId}`
                : API_URL;

            const method = editingId ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    category: form.category,
                    amount: Number(form.amount),
                    date: form.date,
                    description: form.description
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    (editingId
                        ? "Failed to update expense"
                        : "Failed to create expense")
                );
            }

            setForm(initialForm);
            setEditingId(null);

            setMessage(
                editingId
                    ? "Expense updated successfully."
                    : "Expense recorded successfully."
            );

            await fetchExpenses();
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (expense) => {
        setEditingId(expense._id);

        setForm({
            category: expense.category || "",
            amount: expense.amount ?? "",
            date: expense.date
                ? new Date(expense.date).toISOString().split("T")[0]
                : "",
            description: expense.description || ""
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(initialForm);
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
    };

    const cancelDelete = () => {
        setDeleteId(null);
    };

    const handleDelete = async () => {
        if (!deleteId) {
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${API_URL}/${deleteId}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to delete expense"
                );
            }

            setDeleteId(null);
            setMessage("Expense deleted successfully.");

            await fetchExpenses();
        } catch (err) {
            setDeleteId(null);
            setError(err.message || "Failed to delete expense.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    };

    const formatCurrency = (amount) => {
        return Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter((item) => {
            const matchesCategory =
                filterCategory === "ALL" || item.category === filterCategory;

            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                (item.category && item.category.toLowerCase().includes(q)) ||
                (item.description && item.description.toLowerCase().includes(q)) ||
                (item.amount && item.amount.toString().includes(q)) ||
                (item.date && item.date.toLowerCase().includes(q));

            return matchesCategory && matchesQuery;
        });
    }, [expenses, filterCategory, searchQuery]);

    const filteredTotal = useMemo(() => {
        return filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }, [filteredExpenses]);

    return (
        <div className="expense-page">
            {message && (
                <div className="expense-toast expense-toast-success" role="alert">
                    <span className="toast-icon">✓</span>
                    <div className="toast-content">
                        <strong>Success</strong>
                        <span>{message}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="expense-toast expense-toast-error" role="alert">
                    <span className="toast-icon">!</span>
                    <div className="toast-content">
                        <strong>Attention</strong>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="expense-header">
                <div>
                    <h1>Expense Management</h1>
                    <p>Manage business expenses and records</p>
                </div>
            </div>

            <div className="expense-card expense-form-card">
                <div className="expense-card-header">
                    <div>
                        <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>
                        <p>
                            {editingId
                                ? "Update the expense details below."
                                : "Enter the details to record a new expense."}
                        </p>
                    </div>
                </div>

                <form className="expense-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="category">Category</label>
                        <select
                            id="category"
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                        >
                            <option value="">Select category</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="amount">Amount</label>
                        <input
                            id="amount"
                            type="number"
                            name="amount"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="Enter amount"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="date">Date</label>
                        <input
                            id="date"
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="description">Description</label>
                        <input
                            id="description"
                            type="text"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Enter expense description"
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="primary-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Please wait..."
                                : editingId
                                ? "Update Expense"
                                : "Add Expense"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={cancelEdit}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="expense-card expense-list-card">
                <div className="expense-card-header list-header">
                    <div>
                        <h2>Expense Records</h2>
                        <p>
                            {expenses.length}{" "}
                            {expenses.length === 1 ? "record" : "records"} found
                        </p>
                    </div>

                    <div className="table-controls">
                        <div className="search-input-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search records..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="clear-search"
                                    onClick={() => setSearchQuery("")}
                                    title="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <select
                            className="category-filter-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            aria-label="Filter expenses by category"
                        >
                            <option value="ALL">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading && expenses.length === 0 ? (
                    <div className="expense-state">
                        <div className="state-spinner"></div>
                        <p>Loading expenses...</p>
                    </div>
                ) : expenses.length === 0 ? (
                    <div className="expense-state">
                        <div className="state-icon">📂</div>
                        <h3>No expense records found.</h3>
                    </div>
                ) : filteredExpenses.length === 0 ? (
                    <div className="expense-state">
                        <div className="state-icon">🔍</div>
                        <h3>No matching expenses</h3>
                        <p>No records matched your search query or category filter.</p>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                setSearchQuery("");
                                setFilterCategory("ALL");
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="expense-table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th className="th-actions">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredExpenses.map((expense) => {
                                    const catStyle =
                                        categoryColors[expense.category] || categoryColors.Other;

                                    return (
                                        <tr key={expense._id}>
                                            <td>
                                                <span
                                                    className="category-badge"
                                                    style={{
                                                        backgroundColor: catStyle.bg,
                                                        color: catStyle.text,
                                                        borderColor: catStyle.border
                                                    }}
                                                >
                                                    {expense.category}
                                                </span>
                                            </td>

                                            <td className="amount-cell">
                                                ₹{formatCurrency(expense.amount)}
                                            </td>

                                            <td className="date-cell">
                                                {formatDate(expense.date)}
                                            </td>

                                            <td className="description-cell">
                                                {expense.description || (
                                                    <span className="empty-val">-</span>
                                                )}
                                            </td>

                                            <td className="td-actions">
                                                <div className="action-buttons">
                                                    <button
                                                        type="button"
                                                        className="edit-button"
                                                        onClick={() => handleEdit(expense)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="delete-button"
                                                        onClick={() => confirmDelete(expense._id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {deleteId && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div
                        className="delete-modal"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="delete-icon">!</div>

                        <h3>Delete Expense?</h3>

                        <p>
                            Are you sure you want to delete this expense record? This
                            action cannot be undone.
                        </p>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="modal-cancel"
                                onClick={cancelDelete}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="modal-delete"
                                onClick={handleDelete}
                                disabled={loading}
                            >
                                {loading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Expense;