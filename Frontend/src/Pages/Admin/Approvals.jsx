import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import {
  getAdminExpenses,
  approveExpense,
  rejectExpense,
} from "../../services/adminApi";

export default function Approvals() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("approved");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminExpenses(
        filter === "all" ? undefined : filter
      );
      const final =
        filter === "all"
          ? data.filter((e) => e.status !== "draft" && e.status !== "pending")
          : data;

      setExpenses(final);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const handleApprove = async (id) => {
    try {
      const updated = await approveExpense(id);
      setExpenses(expenses.map((e) => (e._id === id ? updated : e)));
    } catch (e) {
      console.error("Failed to proceed payment", e);
      alert("Failed to proceed payment for expense");
    }
  };

  const handleReject = async (id) => {
    try {
      const updated = await rejectExpense(id);
      setExpenses(expenses.map((e) => (e._id === id ? updated : e)));
    } catch (e) {
      console.error("Failed to decline", e);
      alert("Failed to decline expense");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white border-2 border-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Approvals</h1>

          <div className="flex items-center gap-2">
            <label
              htmlFor="status-filter"
              className="text-sm font-medium text-gray-700"
            >
              Filter by Status:
            </label>
            <select
              id="status-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="payment_proceed">Payment Proceed</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left p-2 font-semibold">Employee</th>
                  <th className="text-left p-2 font-semibold">Category</th>
                  <th className="text-left p-2 font-semibold">Amount</th>
                  <th className="text-left p-2 font-semibold">Status</th>
                  <th className="text-left p-2 font-semibold">Submitted At</th>
                  <th className="text-left p-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr
                    key={exp._id || exp.id}
                    className="border-b border-gray-300"
                  >
                    <td className="p-2">
                      {exp.employee?.name || exp.employee}
                    </td>
                    <td className="p-2">
                      {exp.category?.name || exp.category}
                    </td>
                    <td className="p-2">
                      {exp.amountConverted || exp.amountOriginal}
                    </td>
                    <td className="p-2">{exp.status}</td>
                    <td className="p-2">
                      {new Date(exp.createdAt).toLocaleString()}
                    </td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => handleApprove(exp._id || exp.id)}
                        disabled={exp.status !== "approved"}
                        className={`flex items-center gap-2 px-3 py-1 rounded ${
                          exp.status === "approved"
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <CheckCircle size={14} /> Proceed Payment
                      </button>
                      <button
                        onClick={() => handleReject(exp._id || exp.id)}
                        disabled={exp.status !== "approved"}
                        className={`flex items-center gap-2 px-3 py-1 rounded ${
                          exp.status === "approved"
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <XCircle size={14} /> Decline
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-600">
                      No {filter === "all" ? "" : filter} expenses
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
