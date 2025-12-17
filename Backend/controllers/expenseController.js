import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Company from "../models/Company.js";
import User from "../models/User.js";
//import ApprovalRule from "../models/ApprovalRule.js";
import axios from "axios";

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ company: req.user.company }).populate(
      "employee category"
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
      "employee category"
    );
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getManagerExpenses = async (req, res) => {
  try {
    console.log("getManagerExpenses: user", req.user?.id, req.user?.role);
    // Get pending expenses where the current approver is the logged-in user
    const userId = req.user.id;
    let userIdObj;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userIdObj = new mongoose.Types.ObjectId(userId);
      console.log(
        "getManagerExpenses: query using userIdObj=",
        userIdObj.toString()
      );
    } else {
      userIdObj = userId; // fallback, query will still try with raw id
      console.log(
        "getManagerExpenses: userId is not a valid ObjectId, using raw id=",
        userId
      );
    }

    // Match approvals where this user appears in the approvalSequence (use ObjectId for robust matching)
    const expenses = await Expense.find({
      approvalSequence: { $in: [userIdObj] },
      status: "pending",
      $expr: { $lt: ["$currentApprovalStep", { $size: "$approvalSequence" }] },
    }).populate("employee category approvalSequence");

    console.log("getManagerExpenses: matched expenses count=", expenses.length);

    // Also log all pending expenses for the company to help debug missing approvals
    try {
      const companyPending = await Expense.find({
        company: req.user.company,
        status: "pending",
      }).populate("employee approvalSequence");
      console.log(
        "getManagerExpenses: pending in company count=",
        companyPending.length
      );
      companyPending.forEach((e) => {
        console.log(
          "pending-exp",
          e._id.toString(),
          "approvalSeqLen=",
          (e.approvalSequence || []).length,
          "approvalSeq=",
          (e.approvalSequence || []).map((a) => (a._id ? a._id.toString() : a))
        );
      });
    } catch (err) {
      console.error(
        "getManagerExpenses: failed to list company pending",
        err.message
      );
    }

    // Filter to only include expenses where the user is the current approver
    const filteredExpenses = expenses.filter((expense) => {
      const seq = expense.approvalSequence || [];
      const idx =
        typeof expense.currentApprovalStep === "number"
          ? expense.currentApprovalStep
          : 0;
      const current = seq[idx];
      const approverId = current?._id
        ? current._id.toString()
        : current?.toString?.();
      const isCurrent = approverId === req.user.id;
      if (!isCurrent) {
        console.log(
          "getManagerExpenses: skipping expense",
          expense._id.toString(),
          "current approver",
          approverId
        );
      }
      return isCurrent;
    });

    console.log(
      "getManagerExpenses: returning",
      filteredExpenses.length,
      "items"
    );
    res.status(200).json(filteredExpenses);
  } catch (error) {
    console.error("getManagerExpenses Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateExpenseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const expense = await Expense.findById(req.params.id).populate("category");

    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (status === "pending" && expense.currentApprovalStep === 0) {
      // Determine the employee whose expense is being approved (could be the logged-in user
      // or another employee if an admin is submitting on their behalf).
      const targetEmployeeId = expense.employee;
      console.log("updateExpenseStatus: targetEmployeeId=", targetEmployeeId);

      // Prefer the target employee's manager; fall back to the current user's manager.
      let managerUser = null;
      const targetEmployee = await User.findById(targetEmployeeId).populate(
        "manager"
      );
      if (targetEmployee?.manager) {
        managerUser = targetEmployee.manager;
      } else {
        const user = await User.findById(req.user.id).populate("manager");
        if (user?.manager) managerUser = user.manager;
      }

      console.log(
        "updateExpenseStatus: targetEmployee.manager=",
        targetEmployee?.manager,
        "chosen manager=",
        managerUser?._id?.toString()
      );

      if (managerUser) {
        // managerUser may be a populated User object or an ObjectId string — normalize to id
        const managerId = managerUser?._id ? managerUser._id : managerUser;
        console.log(
          "updateExpenseStatus: managerUser type=",
          typeof managerUser,
          "managerId=",
          managerId?.toString?.()
        );
        expense.approvalSequence = [managerId]; // single manager approver
        expense.status = "pending";
        expense.currentApprovalStep = 0;
      } else {
        // No manager found — try company admin, then any company manager, then auto-approve as last resort
        const companyAdmin = await User.findOne({
          company: expense.company,
          role: "admin",
        });
        if (companyAdmin) {
          console.log(
            "updateExpenseStatus: no manager; assigning company admin as approver:",
            companyAdmin._id.toString()
          );
          expense.approvalSequence = [companyAdmin._id];
          expense.status = "pending";
          expense.currentApprovalStep = 0;
        } else {
          const anyManager = await User.findOne({
            company: expense.company,
            role: "manager",
          });
          if (anyManager) {
            console.log(
              "updateExpenseStatus: no employee manager; assigning another company manager:",
              anyManager._id.toString()
            );
            expense.approvalSequence = [anyManager._id];
            expense.status = "pending";
            expense.currentApprovalStep = 0;
          } else {
            // No admin or manager: fall back to auto-approve (should be rare)
            console.log(
              "updateExpenseStatus: no manager/admin/manager found; auto-approving expense"
            );
            expense.status = "approved"; // or "rejected" if you prefer
          }
        }
      }
    } else if (status === "approved") {
      // Only one approver in sequence
      expense.status = "approved";
    } else if (status === "rejected") {
      expense.status = "rejected";
    }

    await expense.save();

    // Re-load with populated fields so caller can see approvalSequence / manager assigned
    const savedExpense = await Expense.findById(expense._id).populate(
      "employee category approvalSequence"
    );
    console.log(
      "updateExpenseStatus: saved approvalSequence=",
      savedExpense.approvalSequence
    );
    res.status(200).json(savedExpense);
  } catch (error) {
    console.error("Update Expense Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
