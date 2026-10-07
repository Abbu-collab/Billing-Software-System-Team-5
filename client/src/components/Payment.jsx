import { useEffect, useState, useMemo } from "react";
import "./Payment.css";

const API_URL = "http://localhost:5001/api/payments";

const initialForm = {
    invoice: "",
    customer: "",
    amount: "",
    paymentMethod: "",
    paymentDate: "",
    status: "PENDING",
    transactionReference: ""
};

const paymentMethods = [
    "Cash",
    "Card",
    "UPI",
    "Bank Transfer",
    "Cheque"
];

function Payment() {
    const [payments, setPayments] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [deleteId, setDeleteId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [filterMethod, setFilterMethod] = useState("ALL");

    useEffect(() => {
        fetchPayments();
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

    const fetchPayments = async () => {
        try {
            setLoading(true);

            const response = await fetch(API_URL);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to fetch payments");
            }

            setPayments(result.data || []);
        } catch (err) {
            setError(err.message || "Failed to load payments");
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

        if (!form.amount || Number(form.amount) <= 0) {
            setError("Please enter a valid payment amount.");
            return;
        }

        if (!form.paymentMethod) {
            setError("Please select a payment method.");
            return;
        }

        if (!form.paymentDate) {
            setError("Please select a payment date.");
            return;
        }

        if (!form.status) {
            setError("Please select a payment status.");
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
                    invoice: form.invoice || undefined,
                    customer: form.customer || undefined,
                    amount: Number(form.amount),
                    paymentMethod: form.paymentMethod,
                    paymentDate: form.paymentDate,
                    status: form.status,
                    transactionReference:
                        form.transactionReference || undefined
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    (editingId
                        ? "Failed to update payment"
                        : "Failed to create payment")
                );
            }

            setForm(initialForm);
            setEditingId(null);

            setMessage(
                editingId
                    ? "Payment updated successfully."
                    : "Payment recorded successfully."
            );

            await fetchPayments();
        } catch (err) {
            setError(err.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (payment) => {
        setEditingId(payment._id);

        setForm({
            invoice: payment.invoice || "",
            customer: payment.customer || "",
            amount: payment.amount ?? "",
            paymentMethod: payment.paymentMethod || "",
            paymentDate: payment.paymentDate
                ? new Date(payment.paymentDate)
                    .toISOString()
                    .split("T")[0]
                : "",
            status: payment.status || "PENDING",
            transactionReference:
                payment.transactionReference || ""
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

            const response = await fetch(
                `${API_URL}/${deleteId}`,
                {
                    method: "DELETE"
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Failed to delete payment"
                );
            }

            setDeleteId(null);
            setMessage("Payment deleted successfully.");

            await fetchPayments();
        } catch (err) {
            setDeleteId(null);
            setError(err.message || "Failed to delete payment.");
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

    const formatAmount = (amount) => {
        return Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const filteredPayments = useMemo(() => {
        return payments.filter((item) => {
            const matchesStatus =
                filterStatus === "ALL" || item.status === filterStatus;

            const matchesMethod =
                filterMethod === "ALL" || item.paymentMethod === filterMethod;

            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                (item.invoice && item.invoice.toLowerCase().includes(q)) ||
                (item.customer && item.customer.toLowerCase().includes(q)) ||
                (item.transactionReference &&
                    item.transactionReference.toLowerCase().includes(q)) ||
                (item.paymentMethod &&
                    item.paymentMethod.toLowerCase().includes(q)) ||
                (item.amount && item.amount.toString().includes(q));

            return matchesStatus && matchesMethod && matchesQuery;
        });
    }, [payments, filterStatus, filterMethod, searchQuery]);

    return (
        <div className="payment-page">
            {message && (
                <div className="payment-toast payment-toast-success" role="alert">
                    <span className="toast-icon">✓</span>
                    <div className="toast-content">
                        <strong>Success</strong>
                        <span>{message}</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="payment-toast payment-toast-error" role="alert">
                    <span className="toast-icon">!</span>
                    <div className="toast-content">
                        <strong>Attention</strong>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="payment-header">
                <div>
                    <h1>Payment Management</h1>
                    <p>Manage customer payments and payment records</p>
                </div>
            </div>

            <div className="payment-card payment-form-card">
                <div className="payment-card-header">
                    <div>
                        <h2>
                            {editingId
                                ? "Edit Payment"
                                : "Record Payment"}
                        </h2>
                        <p>
                            {editingId
                                ? "Update the payment details below."
                                : "Enter the details to record a payment."}
                        </p>
                    </div>
                </div>

                <form className="payment-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="invoice">Invoice ID</label>
                        <input
                            id="invoice"
                            name="invoice"
                            type="text"
                            value={form.invoice}
                            onChange={handleChange}
                            placeholder="Enter invoice ID"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="customer">Customer ID</label>
                        <input
                            id="customer"
                            name="customer"
                            type="text"
                            value={form.customer}
                            onChange={handleChange}
                            placeholder="Enter customer ID"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="amount">Amount</label>
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="Enter payment amount"
                            min="0.01"
                            step="0.01"
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="paymentMethod">Payment Method</label>
                        <select
                            id="paymentMethod"
                            name="paymentMethod"
                            value={form.paymentMethod}
                            onChange={handleChange}
                        >
                            <option value="">Select payment method</option>
                            {paymentMethods.map((method) => (
                                <option key={method} value={method}>
                                    {method}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label htmlFor="paymentDate">Payment Date</label>
                        <input
                            id="paymentDate"
                            name="paymentDate"
                            type="date"
                            value={form.paymentDate}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                        >
                            <option value="PENDING">PENDING</option>
                            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                            <option value="PAID">PAID</option>
                        </select>
                    </div>

                    <div className="form-field form-field-full">
                        <label htmlFor="transactionReference">
                            Transaction Reference
                        </label>
                        <input
                            id="transactionReference"
                            name="transactionReference"
                            type="text"
                            value={form.transactionReference}
                            onChange={handleChange}
                            placeholder="Enter transaction reference"
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
                                ? "Update Payment"
                                : "Record Payment"}
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

            <div className="payment-card payment-list-card">
                <div className="payment-card-header list-header">
                    <div>
                        <h2>Payment Records</h2>
                        <p>
                            {payments.length}{" "}
                            {payments.length === 1 ? "record" : "records"} found
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
                            className="filter-select"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            aria-label="Filter by Status"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PAID">PAID</option>
                            <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                            <option value="PENDING">PENDING</option>
                        </select>

                        <select
                            className="filter-select"
                            value={filterMethod}
                            onChange={(e) => setFilterMethod(e.target.value)}
                            aria-label="Filter by Method"
                        >
                            <option value="ALL">All Methods</option>
                            {paymentMethods.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading && payments.length === 0 ? (
                    <div className="payment-state">
                        <div className="state-spinner"></div>
                        <p>Loading payments...</p>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="payment-state">
                        <div className="state-icon">💳</div>
                        <h3>No payment records found.</h3>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="payment-state">
                        <div className="state-icon">🔍</div>
                        <h3>No matching payments</h3>
                        <p>No records matched your search query or active filters.</p>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => {
                                setSearchQuery("");
                                setFilterStatus("ALL");
                                setFilterMethod("ALL");
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : (
                    <div className="payment-table-wrapper">
                        <table className="payment-table">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Customer</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Transaction Ref</th>
                                    <th className="th-actions">Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPayments.map((payment) => (
                                    <tr key={payment._id}>
                                        <td>
                                            {payment.invoice || "-"}
                                        </td>

                                        <td>
                                            {payment.customer || "-"}
                                        </td>

                                        <td className="amount-cell">
                                            ₹{formatAmount(payment.amount)}
                                        </td>

                                        <td>
                                            {payment.paymentMethod}
                                        </td>

                                        <td className="date-cell">
                                            {formatDate(payment.paymentDate)}
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge status-${payment.status.toLowerCase()}`}
                                            >
                                                {payment.status.replace("_", " ")}
                                            </span>
                                        </td>

                                        <td>
                                            {payment.transactionReference || "-"}
                                        </td>

                                        <td className="td-actions">
                                            <div className="action-buttons">
                                                <button
                                                    type="button"
                                                    className="edit-button"
                                                    onClick={() => handleEdit(payment)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="delete-button"
                                                    onClick={() =>
                                                        confirmDelete(payment._id)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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

                        <h3>Delete Payment?</h3>

                        <p>
                            Are you sure you want to delete this payment
                            record? This action cannot be undone.
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

export default Payment;