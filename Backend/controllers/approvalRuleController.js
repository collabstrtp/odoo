/* import ApprovalRule from "../models/ApprovalRule.js";

export const getApprovalRules = async (req, res) => {
  try {
    const rules = await ApprovalRule.find({
      company: req.user.company,
    }).populate("categories approvalSequence specificApproverIds");
    res.status(200).json(rules);
  } catch (error) {
    console.error("Get Approval Rules Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const createApprovalRule = async (req, res) => {
  try {
    const {
      name,
      description,
      /*       categories,
       *approvalSequence,
      minimumPercentApproval,
      specificApproverIds,
      isManagerFirst,
      isSequential,
    } = req.body;
    const rule = new ApprovalRule({
      company: req.user.company,
      name,
      description,
      /*       categories,
        approvalSequence,
      minimumPercentApproval,
      specificApproverIds,
      isManagerFirst,
      isSequential,
    });
    await rule.save();
    res.status(201).json(rule);
  } catch (error) {
    console.error("Create Approval Rule Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const updateApprovalRule = async (req, res) => {
  try {
    const {
      name,
      description,
      /*       categories,
        approvalSequence,
      minimumPercentApproval,
      specificApproverIds,
      isManagerFirst,
      isSequential,
    } = req.body;

    const rule = await ApprovalRule.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        /*         categories,
         approvalSequence,
        minimumPercentApproval,
        specificApproverIds,
        isManagerFirst,
        isSequential,
      },
      { new: true }
    );

    if (!rule) {
      return res.status(404).json({ message: "Rule not found" });
    }

    res.status(200).json(rule);
  } catch (error) {
    console.error("Update Approval Rule Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
 */
