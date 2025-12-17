import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
//import ApprovalRule from "../models/ApprovalRule.js";
import axios from "axios";

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ company: req.user.company }).populate(
      "employee category approvalSequence"
    );
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createExpense = async (req, res) => {
  try {
    const {
      category,
      description,
      amountOriginal,
      currencyOriginal,
      receiptUrl,
      dateIncurred,
    } = req.body;

    // Get company's base currency
    const company = await Company.findById(req.user.company);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const baseCurrency = company.baseCurrency;

    // Convert currency if needed
    let amountConverted = amountOriginal;
    if (currencyOriginal !== baseCurrency) {
      try {
        const response = await axios.get(
          `https://api.exchangerate-api.com/v4/latest/${currencyOriginal}`
        );
        const rate = response.data.rates[baseCurrency];
        amountConverted = amountOriginal * rate;
      } catch (conversionError) {
        console.error("Currency conversion error:", conversionError.message);
        // Fallback to original amount if conversion fails
        amountConverted = amountOriginal;
      }
    }

    const expense = new Expense({
      employee: req.user.id,
      company: req.user.company,
      category,
      description,
      amountOriginal,
      currencyOriginal,
      amountConverted,
      receiptUrl,
      dateIncurred,
      status: "draft",
      currentApprovalStep: 0,
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error("Create Expense Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ employee: req.user.id }).populate(
      "employee category approvalSequence"
    );
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getManagerExpenses = async (req, res) => {
  try {
    console.log("getManagerExpenses: user", req.user?.id, req.user?.role);
    const userId = req.user.id;
    const statusFilter = req.query.status; // optional: pending, approved, rejected

    if (statusFilter === "pending") {
      // Fetch pending expenses in company and populate employee.manager & approvalSequence
      const pending = await Expense.find({
        company: req.user.company,
        status: "pending",
      })
        .populate({ path: "employee", populate: { path: "manager" } })
        .populate("category approvalSequence");

      console.log("getManagerExpenses: company pending count=", pending.length);

      const filtered = pending.filter((expense) => {
        const seq = expense.approvalSequence || [];
        const idx =
          typeof expense.currentApprovalStep === "number"
            ? expense.currentApprovalStep
            : 0;
        const current = seq[idx];
        const approverId = current?._id
          ? current._id.toString()
          : current
          ? current.toString()
          : null;

        if (approverId === userId) return true;

        // Check employee manager match
        const empManagerId = expense.employee?.manager?._id
          ? expense.employee.manager._id.toString()
          : expense.employee?.manager
          ? expense.employee.manager.toString()
          : null;

        if (empManagerId === userId && (seq.length === 0 || idx === 0))
          return true;

        return false;
      });

      console.log(
        "getManagerExpenses: returning pending",
        filtered.length,
        "items"
      );
      return res.status(200).json(filtered);
    }

    // For other statuses or all: return all expenses in company (optionally filtered by status)
    const query = { company: req.user.company };
    if (statusFilter && ["approved", "rejected"].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const expenses = await Expense.find(query)
      .sort({ createdAt: -1 })
      .populate({ path: "employee", populate: { path: "manager" } })
      .populate("category approvalSequence");

    console.log(
      "getManagerExpenses: returning all/company filtered count=",
      expenses.length
    );
    res.status(200).json(expenses);
  } catch (error) {
    console.error("getManagerExpenses Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateExpenseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const expense = await Expense.findById(req.params.id).populate(
      "category employee approvalSequence"
    );

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const userId = req.user.id;

    // Submit expense (employee action): build approval sequence then set to pending
    if (status === "pending") {
      if (expense.status !== "draft")
        return res
          .status(400)
          .json({ message: "Only draft expenses can be submitted" });

      // Try to find an approval rule for this company/category
      let seq = [];
      try {
        const ApprovalRule = (await import("../models/ApprovalRule.js"))
          .default;
        const rule = await ApprovalRule.findOne({
          company: expense.company,
          $or: [{ categories: expense.category }, { categories: { $size: 0 } }],
        });
        if (rule && rule.approvalSequence && rule.approvalSequence.length) {
          seq = rule.approvalSequence.slice();
        }
      } catch (e) {
        // If ApprovalRule model isn't available or query fails, we'll fallback
        console.warn("ApprovalRule lookup failed or not present", e.message);
      }

      // Fallback sequence: employee's manager then company admin
      if (!seq || seq.length === 0) {
        const employee = await User.findById(expense.employee).populate(
          "manager"
        );
        if (employee?.manager) seq.push(employee.manager._id);
        const companyAdmin = await User.findOne({
          company: expense.company,
          role: "admin",
        });
        if (companyAdmin) seq.push(companyAdmin._id);

        // remove duplicates and falsy values
        seq = [...new Set(seq.filter((s) => !!s))];
      }

      if (seq.length === 0) {
        // No approvers available -> auto-approve
        expense.status = "approved";
        expense.approvalSequence = [];
        expense.currentApprovalStep = 0;
      } else {
        expense.approvalSequence = seq;
        expense.status = "pending";
        expense.currentApprovalStep = 0;
      }

      await expense.save();
      const reloaded = await Expense.findById(expense._id).populate(
        "employee category approvalSequence"
      );
      return res.status(200).json(reloaded);
    }

    // Approve or reject (approver action)
    if (status === "approved" || status === "rejected") {
      const seq = expense.approvalSequence || [];
      const idx =
        typeof expense.currentApprovalStep === "number"
          ? expense.currentApprovalStep
          : 0;
      const currentApprover = seq[idx];

      // Determine authorization: allow if current approver matches user, or user is admin,
      // or user is employee's manager (when at first step or no sequence exists)
      let allowed = false;
      if (req.user.role === "admin") {
        allowed = true;
        console.log(
          "updateExpenseStatus: admin user allowed to act",
          req.user.id
        );
      }

      if (currentApprover && currentApprover.toString() === userId.toString()) {
        allowed = true;
        console.log("updateExpenseStatus: user is current approver", userId);
      }

      if (!allowed) {
        // Check if user is employee manager
        const emp = await User.findById(expense.employee).populate("manager");
        const empManagerId = emp?.manager?._id
          ? emp.manager._id.toString()
          : emp?.manager
          ? emp.manager.toString()
          : null;

        if (empManagerId === userId && (seq.length === 0 || idx === 0)) {
          allowed = true;
          console.log(
            "updateExpenseStatus: user is employee manager and allowed",
            userId
          );

          // If there was no sequence, ensure manager is first approver for consistent progression
          if (!seq || seq.length === 0) {
            if (emp.manager && emp.manager._id) {
              expense.approvalSequence = [emp.manager._id];
            } else if (emp.manager) {
              expense.approvalSequence = [emp.manager];
            }
            expense.currentApprovalStep = 0;
          }
        }
      }

      if (!allowed) {
        return res
          .status(403)
          .json({ message: "You are not the current approver" });
      }

      if (status === "rejected") {
        expense.status = "rejected";
        await expense.save();
        const reloaded = await Expense.findById(expense._id).populate(
          "employee category approvalSequence"
        );
        return res.status(200).json(reloaded);
      }

      // status === 'approved'
      // Re-evaluate sequence in case we changed it
      const refreshedSeq = expense.approvalSequence || [];
      const refreshedIdx =
        typeof expense.currentApprovalStep === "number"
          ? expense.currentApprovalStep
          : 0;

      // If current approver is the last in sequence, final approval
      if (refreshedIdx >= refreshedSeq.length - 1) {
        expense.status = "approved";
        expense.currentApprovalStep = refreshedIdx + 1; // mark completed
      } else {
        // Move to next approver and keep pending
        expense.currentApprovalStep = refreshedIdx + 1;
        expense.status = "pending";
      }

      await expense.save();
      const reloaded = await Expense.findById(expense._id).populate(
        "employee category approvalSequence"
      );
      return res.status(200).json(reloaded);
    }

    return res.status(400).json({ message: "Invalid status action" });
  } catch (error) {
    console.error("Update Expense Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
