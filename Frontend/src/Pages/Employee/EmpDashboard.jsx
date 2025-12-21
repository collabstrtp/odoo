import React, { useState, useEffect } from "react";
import { Upload, Plus } from "lucide-react";
import {
  getEmployeeExpenses,
  createExpense,
  updateExpenseStatus,
} from "../../services/employeeApi";
import { getCategories } from "../../services/categoryApi";

export default function EmpDashboard() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [expenseData, categoryData] = await Promise.all([
          getEmployeeExpenses(),
          getCategories(),
        ]);
        if (expenseData) {
          setExpenses(expenseData);
        }
        if (categoryData) {
          setCategories(categoryData);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    }
    fetchData();
  }, []);

  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    date: "",
    category: "",
    paidBy: "",
    remarks: "",
    amount: "",
    currency: "INR",
  });

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const addExpense = async () => {
    if (newExpense.description && newExpense.amount && newExpense.category) {
      try {
        // Transform frontend data to match backend expectations
        const expenseData = {
          category: newExpense.category, // This should be the category ObjectId
          description: newExpense.description,
          amountOriginal: parseFloat(newExpense.amount),
          currencyOriginal: newExpense.currency,
          dateIncurred: newExpense.date,
          receiptUrl: "", // TODO: Add receipt upload functionality
        };

        const createdExpense = await createExpense(expenseData);
        setExpenses([...expenses, createdExpense]);
        setNewExpense({
          description: "",
          date: "",
          category: "",
          paidBy: "",
          remarks: "",
          amount: "",
          currency: "INR",
        });
        setShowNewExpenseModal(false);
      } catch (error) {
        console.error("Failed to create expense", error);
      }
    }
  };

  const submitExpense = async (id) => {
    try {
      const updated = await updateExpenseStatus(id, { status: "pending" });
      setExpenses(
        expenses.map((exp) => (exp._id === id || exp.id === id ? updated : exp))
      );
      if (
        selectedExpense &&
        (selectedExpense._id === id || selectedExpense.id === id)
      ) {
        setSelectedExpense(updated);
      }
    } catch (error) {
      console.error("Failed to update expense status", error);
    }
  };

  const viewExpenseDetails = (expense) => {
    setSelectedExpense(expense);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700 border-gray-300",
      pending: "bg-yellow-100 text-yellow-700 border-yellow-300",
      approved: "bg-green-100 text-green-700 border-green-300",
      rejected: "bg-red-100 text-red-700 border-red-300",
    };
    return styles[status] || styles["draft"];
  };

  const getTotalByStatus = (status) => {
    return expenses
      .filter((e) => e.status === status)
      .reduce((sum, e) => sum + parseFloat(e.amountConverted || 0), 0)
      .toFixed(2);
  };

  const getCountByStatus = (status) => {
    return expenses.filter((e) => e.status === status).length;
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`Receipt uploaded: ${file.name}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Employee's View</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          User should be able to upload a receipt from his computer or take a
          photo of the receipt, using OCR a new expense should get created with
          total amount and other necessary details.
        </p>
      </div>

      {/* Status Flow Indicator */}
      <div className="bg-white border-2 border-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gray-200 border-2 border-gray-800 flex flex-col items-center justify-center mb-2">
              <span className="text-xl font-bold">
                {getTotalByStatus("draft")}
              </span>
              <span className="text-xs text-gray-600">USD</span>
            </div>
            <span className="text-sm font-semibold">Draft</span>
            <span className="text-xs text-gray-500">To submit</span>
            <span className="text-xs text-gray-500 mt-1">
              ({getCountByStatus("draft")} items)
            </span>
          </div>

          <div className="flex-1 flex items-center mx-4">
            <div className="flex-1 h-1 bg-gray-400"></div>
            <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-gray-400"></div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-yellow-100 border-2 border-yellow-500 flex flex-col items-center justify-center mb-2">
              <span className="text-xl font-bold text-yellow-700">
                {getTotalByStatus("pending")}
              </span>
              <span className="text-xs text-yellow-600">USD</span>
            </div>
            <span className="text-sm font-semibold">Pending</span>
            <span className="text-xs text-gray-500 mt-1">
              ({getCountByStatus("pending")} items)
            </span>
          </div>

          <div className="flex-1 flex items-center mx-4">
            <div className="flex-1 h-1 bg-gray-400"></div>
            <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-gray-400"></div>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-green-100 border-2 border-green-500 flex flex-col items-center justify-center mb-2">
              <span className="text-xl font-bold text-green-700">
                {getTotalByStatus("approved")}
              </span>
              <span className="text-xs text-green-600">USD</span>
            </div>
            <span className="text-sm font-semibold">Approved</span>
            <span className="text-xs text-gray-500 mt-1">
              ({getCountByStatus("approved")} items)
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center italic">
          Expenses which are submitted by employee but not finally approved by
          matching approval rules.
        </p>
      </div>

      {/* Expenses Table */}
      <div className="bg-white border-2 border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setShowNewExpenseModal(true)}
            className="px-4 py-2 bg-white border-2 border-gray-800 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus size={16} /> New
          </button>
          <label className="px-4 py-2 bg-blue-600 text-white border-2 border-blue-600 rounded hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
            <Upload size={16} /> Upload Receipt
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left p-2 font-semibold">Description</th>
                <th className="text-left p-2 font-semibold">Date</th>
                <th className="text-left p-2 font-semibold">Category</th>
                <th className="text-left p-2 font-semibold">Paid By</th>
                <th className="text-left p-2 font-semibold">Remarks</th>
                <th className="text-left p-2 font-semibold">Amount</th>
                <th className="text-left p-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id || expense._id}
                  className="border-b border-gray-300 hover:bg-gray-50 cursor-pointer"
                  onClick={() => viewExpenseDetails(expense)}
                >
                  {/* <td className="p-2">
                    {expense.employee?.name ||
                      expense.employee?.email ||
                      "Unknown"}
                  </td> */}
                  <td className="p-2">{expense.description}</td>
                  <td className="p-2">{expense.date}</td>
                  <td className="p-2">
                    {categories.find((c) => c._id === expense.category)?.name ||
                      (typeof expense.category === "object"
                        ? expense.category.name
                        : expense.category) ||
                      "Unknown"}
                  </td>
                  <td className="p-2">{expense.paidBy}</td>
                  <td className="p-2">{expense.remarks}</td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {expense.amountOriginal} {expense.currencyOriginal}
                      </span>
                      <span className="text-xs text-gray-500">
                        ≈ {expense.amountConverted} USD
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(
                        expense.status
                      )}`}
                    >
                      {expense.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500 italic">
          <p className="text-red-600 mb-2">
            <strong>Note:</strong> Employees can submit expense in any currency
            (currency in which he spent the money in receipt)
          </p>
          <p>
            In manager's approval dashboard, the amount should get
            auto-converted to base currency of the company with realtime today's
            currency conversion rates.
          </p>
        </div>
      </div>

      {/* New Expense Modal */}
      {showNewExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-gray-800 p-6">
              <h2 className="text-xl font-bold">Add New Expense</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Enter description"
                  className="w-full border-2 border-gray-300 rounded px-3 py-2"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-300 rounded px-3 py-2"
                    value={newExpense.date}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Category
                  </label>
                  <select
                    className="w-full border-2 border-gray-300 rounded px-3 py-2"
                    value={newExpense.category}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, category: e.target.value })
                    }
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Paid By
                </label>
                <input
                  type="text"
                  placeholder="Who paid for this?"
                  className="w-full border-2 border-gray-300 rounded px-3 py-2"
                  value={newExpense.paidBy}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, paidBy: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full border-2 border-gray-300 rounded px-3 py-2"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Currency
                  </label>
                  <select
                    className="w-full border-2 border-gray-300 rounded px-3 py-2"
                    value={newExpense.currency}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, currency: e.target.value })
                    }
                  >
                    <option>INR</option>
                    <option>USD</option>
                    <option>EUR</option>
                    <option>GBP</option>
                    <option>JPY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Remarks
                </label>
                <textarea
                  placeholder="Add any additional notes..."
                  className="w-full border-2 border-gray-300 rounded px-3 py-2 h-20"
                  value={newExpense.remarks}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, remarks: e.target.value })
                  }
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The amount will be automatically
                  converted to your company's base currency for approval.
                </p>
              </div>
            </div>

            <div className="border-t-2 border-gray-200 p-6 flex gap-3 justify-start">
              <button
                onClick={addExpense}
                className="px-6 py-2 bg-blue-500 text-white border-2  rounded hover:bg-blue-700 font-semibold"
              >
                Submit
              </button>{" "}
              <button
                onClick={() => setShowNewExpenseModal(false)}
                className="px-6 py-2 bg-white border-2 border-gray-800 rounded hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Details Modal */}
      {showDetailModal && selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-gray-800 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Expense Details</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  Draft → Waiting approval → Approved
                </span>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium border ${getStatusBadge(
                    selectedExpense.status
                  )}`}
                >
                  {selectedExpense.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              {/* Attach Receipt Button */}
              <div className="mb-6">
                <button className="px-4 py-2 bg-white border-2 border-gray-800 rounded hover:bg-gray-50 flex items-center gap-2">
                  <Upload size={16} /> Attach Receipt
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">
                      Description
                    </label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-gray-50"
                      value={selectedExpense.description}
                      disabled={selectedExpense.status !== "draft"}
                      readOnly={selectedExpense.status !== "draft"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">
                      Category
                    </label>
                    <select
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-gray-50"
                      value={selectedExpense.category}
                      disabled={selectedExpense.status !== "draft"}
                    >
                      <option>Food</option>
                      <option>Travel</option>
                      <option>Supplies</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">
                      Total amount in currency selection
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="flex-1 border-2 border-gray-300 rounded px-3 py-2 bg-gray-50"
                        value={selectedExpense.amountOriginal}
                        disabled={selectedExpense.status !== "draft"}
                        readOnly={selectedExpense.status !== "draft"}
                      />
                      <select
                        className="border-2 border-gray-300 rounded px-3 py-2 bg-gray-50"
                        value={selectedExpense.currencyOriginal}
                        disabled={selectedExpense.status !== "draft"}
                      >
                        <option>INR</option>
                        <option>USD</option>
                        <option>EUR</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">
                      Description
                    </label>
                    <textarea
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-gray-50 h-24"
                      value={
                        selectedExpense.remarks || selectedExpense.description
                      }
                      disabled={selectedExpense.status !== "draft"}
                      readOnly={selectedExpense.status !== "draft"}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-gray-50"
                      value={selectedExpense.date}
                      disabled={selectedExpense.status !== "draft"}
                      readOnly={selectedExpense.status !== "draft"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">
                      Paid by:
                    </label>
                    <select
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-gray-50"
                      value={selectedExpense.paidBy}
                      disabled={selectedExpense.status !== "draft"}
                    >
                      <option>Self</option>
                      <option>Company</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-600">
                      Remarks
                    </label>
                    <textarea
                      className="w-full border-2 border-gray-300 rounded px-3 py-2 bg-gray-50 h-24"
                      value={selectedExpense.remarks}
                      disabled={selectedExpense.status !== "draft"}
                      readOnly={selectedExpense.status !== "draft"}
                    />
                  </div>
                </div>
              </div>

              {/* Currency Conversion Info */}
              <div className="mt-6 bg-red-50 border border-red-200 rounded p-4">
                <p className="text-sm text-red-700">
                  <strong>Note:</strong> Employees can submit expense in any
                  currency (currency in which he spent the money in receipt)
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  In manager's approval dashboard, the amount should get
                  auto-converted to base currency of the company with realtime
                  today's currency conversion rates.
                </p>
              </div>

              {/* Approval Log */}
              {(selectedExpense.status === "approved" ||
                selectedExpense.status === "rejected") &&
                selectedExpense.approver && (
                  <div className="mt-6 bg-white border-2 border-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Approval History
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-300">
                            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">
                              Approver
                            </th>
                            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">
                              Status
                            </th>
                            <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-200">
                            <td className="p-3">{selectedExpense.approver}</td>
                            <td className="p-3">
                              <span
                                className={`font-semibold ${
                                  selectedExpense.status === "approved"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {selectedExpense.approvalStatus}
                              </span>
                            </td>
                            <td className="p-3">
                              {selectedExpense.approvalTime}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {/* Approval Sequence */}
              {selectedExpense.approvalSequence &&
                selectedExpense.approvalSequence.length > 0 && (
                  <div className="mt-6 bg-white border-2 border-gray-800 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-4">
                      Approval Sequence
                    </h3>
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {selectedExpense.approvalSequence.map((approver, idx) => (
                        <li
                          key={approver._id || approver}
                          className={
                            idx === selectedExpense.currentApprovalStep
                              ? "font-semibold text-yellow-700"
                              : ""
                          }
                        >
                          {approver.name || approver.email || approver}
                          {idx === selectedExpense.currentApprovalStep &&
                            " (current)"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedExpense.status !== "draft" && (
                <div className="mt-4 text-xs text-gray-500 italic bg-blue-50 border border-blue-200 rounded p-3">
                  Once submitted the record should become readonly for employee
                  and the submit button should be invisible and status should be
                  updated with approver name and time stamp that which user
                  approved/rejected your request at what time.
                </div>
              )}
            </div>

            <div className="border-t-2 border-gray-200 p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-white border-2 border-gray-800 rounded hover:bg-gray-50 font-semibold"
              >
                Close
              </button>
              {selectedExpense.status === "draft" && (
                <button
                  onClick={() => {
                    submitExpense(selectedExpense._id || selectedExpense.id);
                    setShowDetailModal(false);
                  }}
                  className="px-6 py-2 bg-green-600 text-white border-2 border-green-600 rounded hover:bg-green-700 font-semibold"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
