import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import {
  getPendingExpenses,
  approveExpense,
  rejectExpense,
} from "../../services/managerApi";

export default function ManagerView() {
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    async function fetchPendingExpenses() {
      try {
        const data = await getPendingExpenses();
        console.log("Pending Expenses:", data);
        setApprovals(data);
      } catch (error) {
        console.error("Failed to fetch pending expenses", error);
      }
    }
    fetchPendingExpenses();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveExpense(id);
      setApprovals(
        approvals.map((approval) =>
          approval._id === id ? { ...approval, status: "approved" } : approval
        )
      );
    } catch (error) {
      console.error("Failed to approve expense", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectExpense(id);
      setApprovals(
        approvals.map((approval) =>
          approval._id === id ? { ...approval, status: "rejected" } : approval
        )
      );
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold mb-4">Approvals to review</h2>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const data = await getPendingExpenses();
                  console.log("Manual refresh pending:", data);
                  setApprovals(data);
                } catch (err) {
                  console.error("Manual refresh failed", err);
                }
              }}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                // Toggle the debug JSON view
                const cur = document.getElementById("mgr-debug-json");
                if (cur)
                  cur.style.display =
                    cur.style.display === "none" ? "block" : "none";
              }}
              className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
            >
              Toggle JSON
            </button>
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

        {/*   <div className="overflow-x-auto ">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left p-2 font-semibold">
                  Approval Subject
                </th>
                <th className="text-left p-2 font-semibold">Request Owner</th>
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
              {approvals.map((approval) => (
                <tr
                  key={approval._id}
                  className={`border-b border-gray-300 ${
                    approval.status !== "pending" ? "bg-gray-50 opacity-60" : ""
                  }`}
                >
                  <td className="p-2">{approval.description}</td>
                  <td className="p-2">{approval.employee?.name}</td>
                  <td className="p-2">{approval.category?.name}</td>
                  <td className="p-2">
                    <span
                      className={`font-semibold ${getStatusColor(
                        approval.status
                      )}`}
                    >
                      {approval.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-red-600">
                        {approval.amountOriginal} {approval.currencyOriginal}{" "}
                        (in {approval.currencyOriginal})
                      </span>
                      <span className="font-medium">
                        = {approval.amountConverted} USD
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    {approval.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(approval._id)}
                          className="px-3 py-1 bg-white border-2 border-green-600 text-green-600 rounded hover:bg-green-50 text-sm font-medium flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(approval._id)}
                          className="px-3 py-1 bg-white border-2 border-red-600 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex items-center gap-1"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div> */}
        <div className="overflow-x-auto max-h-80 overflow-y-auto rounded border">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr className="border-b-2 border-gray-800">
                <th className="text-left p-2 font-semibold">
                  Approval Subject
                </th>
                <th className="text-left p-2 font-semibold">Request Owner</th>
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
              {approvals.map((approval) => (
                <tr
                  key={approval._id}
                  className={`border-b border-gray-300 ${
                    approval.status !== "pending" ? "bg-gray-50 opacity-60" : ""
                  }`}
                >
                  <td className="p-2">{approval.description}</td>
                  <td className="p-2">{approval.employee?.name}</td>
                  <td className="p-2">{approval.category?.name}</td>
                  <td className="p-2">
                    <span
                      className={`font-semibold ${getStatusColor(
                        approval.status
                      )}`}
                    >
                      {approval.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-red-600">
                        {approval.amountOriginal} {approval.currencyOriginal}{" "}
                        (in {approval.currencyOriginal})
                      </span>
                      <span className="font-medium">
                        = {approval.amountConverted} USD
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    {approval.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(approval._id)}
                          className="px-3 py-1 bg-white border-2 border-green-600 text-green-600 rounded hover:bg-green-50 text-sm font-medium flex items-center gap-1"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(approval._id)}
                          className="px-3 py-1 bg-white border-2 border-red-600 text-red-600 rounded hover:bg-red-50 text-sm font-medium flex items-center gap-1"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          id="mgr-debug-json"
          style={{ display: "none" }}
          className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-auto"
        >
          <pre>{JSON.stringify(approvals, null, 2)}</pre>
        </div>

        {approvals.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No approvals to review at this time
          </div>
        )}
      </div>
    </div>
  );
}
