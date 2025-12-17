/* import ApprovalAction from "../models/ApprovalAction.js";
import Expense from "../models/Expense.js";
import ApprovalRule from "../models/ApprovalRule.js";
import User from "../models/User.js";

export const getApprovalActions = async (req, res) => {
  try {
    const actions = await ApprovalAction.find({
      expense: req.params.expenseId,
    })
      .populate("user")
      .sort({ stepOrder: 1 });
    res.status(200).json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createApprovalAction = async (req, res) => {
  try {
    const { expense, user, stepOrder, status, comment } = req.body;
    const action = new ApprovalAction({
      expense,
      user,
      stepOrder,
      status,
      comment,
    });
    await action.save();
    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, comments } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (req.user.role !== "manager" && req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });
    // Resolve rule for this expense
    const rule = await ApprovalRule.findOne({
      company: expense.company,
      categories: expense.category,
    });

    // Build approver list
    let approvers = Array.isArray(rule?.approvalSequence)
      ? [...rule.approvalSequence]
      : [];

    // If manager first, add employee's manager to front if present
    if (rule?.isManagerFirst) {
      const employee = await User.findById(expense.employee);
      if (employee?.manager) {
        const managerId = employee.manager.toString();
        if (!approvers.some((a) => a.toString() === managerId)) {
          approvers.unshift(employee.manager);
        }
      }
    }

    // Record approval action
    await ApprovalAction.create({
      expense: id,
      user: approverId,
      stepOrder: expense.currentApprovalStep,
      status: "approved",
      comment: comments,
    });

    if (rule?.isSequential) {
      // Only current approver should approve
      const expectedApproverId =
        approvers[expense.currentApprovalStep]?.toString();
      if (expectedApproverId && expectedApproverId !== approverId) {
        return res.status(403).json({ message: "Not your turn to approve" });
      }
      expense.currentApprovalStep += 1;
      if (expense.currentApprovalStep >= approvers.length) {
        expense.status = "approved";
      }
      await expense.save();
      return res.json({ expense });
    } else {
      // Parallel approvals: compute percent and required approvers
      const actions = await ApprovalAction.find({
        expense: id,
        status: "approved",
      });
      const approvedCount = actions.length;
      const totalApprovers = approvers.length || 1;
      const percentApproved = (approvedCount / totalApprovers) * 100;

      if (
        typeof rule?.minimumPercentApproval === "number" &&
        percentApproved >= rule.minimumPercentApproval
      ) {
        expense.status = "approved";
        await expense.save();
      }
      return res.json({ expense });
    }
  } catch (error) {
    console.error("Approve Expense Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getApprovalSequence = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId).populate("employee");
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Resolve rule for this expense
    const rule = await ApprovalRule.findOne({
      company: expense.company,
      categories: expense.category,
    });

    // Build approver list
    let approvers = Array.isArray(rule?.approvalSequence)
      ? [...rule.approvalSequence]
      : [];

    // If manager first, add employee's manager to front if present
    if (rule?.isManagerFirst) {
      if (expense.employee?.manager) {
        const managerId = expense.employee.manager.toString();
        if (!approvers.some((a) => a.toString() === managerId)) {
          approvers.unshift(expense.employee.manager);
        }
      }
    }

    // Populate approvers with user details
    const populatedApprovers = await User.find({ _id: { $in: approvers } }).select("name email");

    res.status(200).json({
      sequence: populatedApprovers,
      isSequential: rule?.isSequential || false,
      minimumPercentApproval: rule?.minimumPercentApproval || 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, comments } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (req.user.role !== "manager" && req.user.role !== "admin")
      return res.status(403).json({ message: "Access denied" });
    await ApprovalAction.create({
      expense: id,
      user: approverId,
      status: "rejected",
      comment: comments,
    });

    // Rejection immediately rejects expense; if parallel and required approver rejects, reject as well
    expense.status = "rejected";
    await expense.save();
    res.json({ expense });
  } catch (error) {
    console.error("Reject Expense Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
 */ import ApprovalAction from "../models/ApprovalAction.js";
import Expense from "../models/Expense.js";
import User from "../models/User.js";

export const getApprovalActions = async (req, res) => {
  try {
    const actions = await ApprovalAction.find({
      expense: req.params.expenseId,
    })
      .populate("user")
      .sort({ stepOrder: 1 });

    res.status(200).json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createApprovalAction = async (req, res) => {
  try {
    const { expense, user, stepOrder, status, comment } = req.body;

    const action = new ApprovalAction({
      expense,
      user,
      stepOrder,
      status,
      comment,
    });

    await action.save();
    res.status(201).json(action);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, comments } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Optional: check this approver is the current approver
    const expectedApproverId =
      expense.approvalSequence[expense.currentApprovalStep]?.toString();
    if (expectedApproverId && expectedApproverId !== approverId) {
      return res.status(403).json({ message: "Not your turn to approve" });
    }

    // Record approval action
    await ApprovalAction.create({
      expense: id,
      user: approverId,
      stepOrder: expense.currentApprovalStep,
      status: "approved",
      comment: comments,
    });

    // Single manager or simple sequence: move to next or approve
    expense.currentApprovalStep += 1;
    if (
      !expense.approvalSequence ||
      expense.currentApprovalStep >= expense.approvalSequence.length
    ) {
      expense.status = "approved";
    }

    await expense.save();
    return res.json({ expense });
  } catch (error) {
    console.error("Approve Expense Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getApprovalSequence = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const approvers = expense.approvalSequence || [];
    const populatedApprovers = await User.find({
      _id: { $in: approvers },
    }).select("name email");

    res.status(200).json({
      sequence: populatedApprovers,
      isSequential: true, // fixed, simple flow
      minimumPercentApproval: 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { approverId, comments } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    if (req.user.role !== "manager" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await ApprovalAction.create({
      expense: id,
      user: approverId,
      status: "rejected",
      comment: comments,
    });

    expense.status = "rejected";
    await expense.save();

    res.json({ expense });
  } catch (error) {
    console.error("Reject Expense Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
