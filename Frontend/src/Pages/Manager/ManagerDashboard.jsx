import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { CheckCircle, XCircle } from "lucide-react";
import {
  getManagerExpenses,
  approveExpense,
  rejectExpense,
} from "../../services/managerApi";

export default function ManagerView() {
  const user = useSelector((state) => state.auth.user);
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const data = await getManagerExpenses(
          filter === "all" ? undefined : filter
        );
        console.log("Manager Expenses (filter=", filter, "):", data);
        const final =
          filter === "all" ? data.filter((e) => e.status !== "draft") : data;
        setExpenses(final);
      } catch (error) {
        console.error("Failed to fetch manager expenses", error);
      }
    }
    fetchExpenses();
  }, [filter]);

  const handleApprove = async (id) => {
    try {
      const updated = await approveExpense(id);
      setExpenses(expenses.map((e) => (e._id === id ? updated : e)));
    } catch (error) {
      console.error("Failed to approve expense", error);
    }
  };

  const handleReject = async (id) => {
    try {
      const updated = await rejectExpense(id);
      setExpenses(expenses.map((e) => (e._id === id ? updated : e)));
    } catch (error) {
      console.error("Failed to reject expense", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Manager's View</h1>

      <div className="bg-white border-2 border-gray-800 rounded-lg p-4 overflow-y-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">All Expenses</h2>

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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Note:</span> Once the expense is
            approved/rejected by manager, that record should become readonly,
            the status should get set in request status field and the buttons
            should become invisible.
          </p>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto rounded border">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="border-b-2 border-gray-800">
                <th className="text-left p-2 font-semibold">
                  Approval Subject
                </th>
                <th className="text-left p-2 font-semibold">
                  Request Employee
                </th>
                <th className="text-left p-2 font-semibold">Category</th>
                <th className="text-left p-2 font-semibold">Request Status</th>
                <th className="text-left p-2 font-semibold">
                  Total amount
                  <br />
                  <span className="text-xs font-normal text-gray-500">
                    (in company's currency)
                  </span>
                </th>
                <th className="text-left p-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const userId = user?._id
                  ? String(user._id)
                  : user?.id
                  ? String(user.id)
                  : null;
                const seq = expense.approvalSequence || [];
                const idx =
                  typeof expense.currentApprovalStep === "number"
                    ? expense.currentApprovalStep
                    : 0;
                const currentApprover = seq[idx];
                const currentApproverId = currentApprover?._id
                  ? String(currentApprover._id)
                  : currentApprover
                  ? String(currentApprover)
                  : null;
                const empManagerId = expense.employee?.manager?._id
                  ? String(expense.employee.manager._id)
                  : expense.employee?.manager
                  ? String(expense.employee.manager)
                  : null;

                const canAct =
                  expense.status === "pending" &&
                  (user?.role === "admin" ||
                    currentApproverId === userId ||
                    (empManagerId === userId &&
                      (seq.length === 0 || idx === 0)));

                return (
                  <tr
                    key={expense._id}
                    className={`border-b border-gray-300 ${
                      expense.status !== "pending"
                        ? "bg-gray-50 opacity-60"
                        : ""
                    }`}
                  >
                    <td className="p-2">{expense.description}</td>
                    <td className="p-2">{expense.employee?.name}</td>
                    <td className="p-2">{expense.category?.name}</td>
                    <td className="p-2">
                      <span
                        className={`font-semibold ${getStatusColor(
                          expense.status
                        )}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-red-600">
                          {expense.amountOriginal} {expense.currencyOriginal}{" "}
                          (in {expense.currencyOriginal})
                        </span>
                        <span className="font-medium">
                          = {expense.amountConverted} USD
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(expense._id)}
                          disabled={!canAct}
                          className={`px-3 py-1 border-2 rounded text-sm font-medium flex items-center gap-1 ${
                            canAct
                              ? "bg-white border-green-600 text-green-600 hover:bg-green-50"
                              : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(expense._id)}
                          disabled={!canAct}
                          className={`px-3 py-1 border-2 rounded text-sm font-medium flex items-center gap-1 ${
                            canAct
                              ? "bg-white border-red-600 text-red-600 hover:bg-red-50"
                              : "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {expenses.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No expenses found for this selection
          </div>
        )}
      </div>
    </div>
  );
}
