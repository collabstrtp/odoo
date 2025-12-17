/* import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

import {
  fetchApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  fetchUser,
  fetchUsers,
} from "../../services/adminApi";

const SetRules = () => {
  const token = useSelector((state) => state.auth.token) || "YOUR_AUTH_TOKEN";
  const location = useLocation();
  const selectedUserFromNav = location.state?.user;
  const [selectedUser, setSelectedUser] = useState(
    selectedUserFromNav?.name || ""
  );
  const [ruleName, setRuleName] = useState(
    "Approval rule for miscellaneous expenses"
  );
  const [manager, setManager] = useState("");
  const [isManagerApprover, setIsManagerApprover] = useState(false);
  const [approversSequence, setApproversSequence] = useState(false);
  const [minApprovalPercentage, setMinApprovalPercentage] = useState("");
  const [minApprovalError, setMinApprovalError] = useState("");
  const [approvers, setApprovers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [currentRuleId, setCurrentRuleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [requiredIds, setRequiredIds] = useState([]);

  // New states for API-driven rules
  const [rules, setRules] = useState([]);

  // Fetch users for manager and approvers lists
  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await fetchUsers();
        setAllUsers(users);
        // Filter out the manager assigned to the selected user from approvers list
        const filteredApprovers = users.filter((u) => {
          if (!selectedManagerId) return true;
          return u._id !== selectedManagerId && u.id !== selectedManagerId;
        });
        setApprovers(
          filteredApprovers.map((u) => ({
            id: u._id || u.id,
            name: u.name,
          }))
        );
      } catch (e) {
        // silently fail
      }
    }
    loadUsers();
  }, [token, selectedManagerId]);

  // Fetch existing approval rules
  useEffect(() => {
    async function loadRules() {
      try {
        const data = await fetchApprovalRules();
        setRules(data);
      } catch (e) {
        // silently fail
      }
    }
    loadRules();
  }, [token]);

  // Prefill fields from navigation state user and existing rule
  useEffect(() => {
    async function prefill() {
      if (!selectedUserFromNav) return;
      try {
        const userDetail = await fetchUser(
          selectedUserFromNav.id || selectedUserFromNav._id
        );
        setSelectedUser(userDetail?.name || "");
        if (userDetail?.manager) {
          setSelectedManagerId(
            typeof userDetail.manager === "object"
              ? userDetail.manager._id || userDetail.manager.id || ""
              : userDetail.manager
          );
        }
        // Find rule that matches the selected user or use first rule
        const matchingRule =
          rules?.find(
            (rule) =>
              rule.description?.includes(selectedUserFromNav.name) ||
              rule.description?.includes(userDetail?.name)
          ) || rules?.[0];

        if (matchingRule) {
          setCurrentRuleId(matchingRule._id);
          setRuleName(matchingRule.name || "");
          setIsManagerApprover(!!matchingRule.isManagerFirst);
          setApproversSequence(!!matchingRule.isSequential);
          setMinApprovalPercentage(matchingRule.minimumPercentApproval || "");

          if (Array.isArray(matchingRule.specificApproverIds)) {
            const ids = matchingRule.specificApproverIds.map((a) =>
              typeof a === "object" ? a._id : a
            );
            setRequiredIds(ids);
          }
        }
      } catch (e) {
        // ignore
      }
    }
    prefill();
  }, [selectedUserFromNav, rules]);

  // Set required checkboxes based on rule and approvers
  useEffect(() => {
    if (!selectedUserFromNav || !rules.length || !approvers.length) return;
    const matchingRule =
      rules?.find(
        (rule) =>
          rule.description?.includes(selectedUserFromNav.name) ||
          rule.description?.includes(selectedUser)
      ) || rules?.[0];

    if (
      matchingRule &&
      Array.isArray(matchingRule.approvalSequence) &&
      Array.isArray(matchingRule.specificApproverIds)
    ) {
      // Normalize all IDs to strings for comparison
      const allIds = matchingRule.approvalSequence.map((a) =>
        typeof a === "object" ? String(a._id) : String(a)
      );
      const required = matchingRule.specificApproverIds.map((a) =>
        typeof a === "object" ? String(a._id) : String(a)
      );
      setRequiredIds(required);

      // Reorder approvers to match the saved sequence order
      const orderedApprovers = allIds
        .map((id) => approvers.find((a) => String(a.id) === id))
        .filter(Boolean)
        .concat(approvers.filter((a) => !allIds.includes(String(a.id))));

      // Only update if the order has changed to prevent infinite loop
      const currentIds = approvers.map((a) => String(a.id));
      const orderedIds = orderedApprovers.map((a) => String(a.id));
      if (JSON.stringify(currentIds) !== JSON.stringify(orderedIds)) {
        setApprovers(orderedApprovers);
      }
    }
  }, [rules, selectedUserFromNav, selectedUser]);

  // Save new approval rule
  async function saveRule() {
    setSaveError("");
    setMinApprovalError("");
    if (!ruleName?.trim()) {
      setSaveError("Rule name is required");
      return;
    }
    if (
      minApprovalPercentage !== "" &&
      (isNaN(minApprovalPercentage) ||
        minApprovalPercentage < 0 ||
        minApprovalPercentage > 100)
    ) {
      setMinApprovalError(
        "Minimum approval percentage must be a number between 0 and 100"
      );
      return;
    }
    const selectedApproverIds = requiredIds;
    const allApproverIds = approvers.map((a) => a.id);
    const payload = {
      name: ruleName,
      description: `Rule for ${selectedUser}`,
      approvalSequence: allApproverIds,
      minimumPercentApproval: minApprovalPercentage
        ? Number(minApprovalPercentage)
        : undefined,
      specificApproverIds: selectedApproverIds,
      isManagerFirst: !!isManagerApprover,
      isSequential: !!approversSequence,
    };
    try {
      setSaving(true);
      let rule;
      if (currentRuleId) {
        // Update existing rule
        rule = await updateApprovalRule(currentRuleId, payload);
        setRules((prev) =>
          prev.map((r) => (r._id === currentRuleId ? rule : r))
        );
      } else {
        // Create new rule
        rule = await createApprovalRule(payload);
        setRules((prev) => [...prev, rule]);
        setCurrentRuleId(rule._id);
      }
    } catch (e) {
      console.error("Save rule failed", e);
      setSaveError(e?.response?.data?.message || "Failed to save rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto overflow-y-auto">
      <h2 className="text-2xl font-semibold mb-6">Approval Rules</h2>
      <div className="bg-white rounded-lg p-6">
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">User</label>
          <input
            type="text"
            name="user"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full border-b-2 border-gray-800 px-2 py-1 focus:outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Description about rule
          </label>
          <input
            type="text"
            name="description"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            className="w-full border-b-2 border-gray-800 px-2 py-1 focus:outline-none"
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Manager</label>
          <select
            value={selectedManagerId}
            name="manager"
            onChange={(e) => setSelectedManagerId(e.target.value)}
            className="w-full border-b-2 border-gray-800 px-2 py-1 focus:outline-none"
          >
            <option value="">Select Manager</option>
            {allUsers
              .filter((u) => u.role === "manager" || u.role === "admin")
              .map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            name="isManagerApprover"
            checked={isManagerApprover}
            onChange={(e) => setIsManagerApprover(e.target.checked)}
            className="mr-2"
          />
          <span>Is manager an approver?</span>
        </div>

      
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Approvers</label>
          <div className="space-y-2">
            {approvers
              .filter((a) => {
                // Exclude manager if isManagerApprover and approversSequence are true
                if (isManagerApprover && approversSequence) {
                  return a.id !== selectedManagerId;
                }
                return true;
              })
              .map((a, idx) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 p-2 border rounded"
                >
                  <span className="w-6 text-center font-semibold">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{a.name}</span>
                  <input
                    type="checkbox"
                    name="clicked/not-clicked"
                    checked={requiredIds.includes(a.id)}
                    onChange={(e) =>
                      setRequiredIds((prev) =>
                        e.target.checked
                          ? [...prev, a.id]
                          : prev.filter((id) => id !== a.id)
                      )
                    }
                    className="mr-2"
                  />
                </div>
              ))}
          </div>
        </div>
        <div className="mb-6 flex items-center">
          <input
            type="checkbox"
            name="approversSequence"
            checked={approversSequence}
            onChange={(e) => setApproversSequence(e.target.checked)}
            className="mr-2"
          />
          <span>Approvers Sequence</span>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Minimum Approval Percentage
          </label>
          <input
            type="number"
            name="minApprovalPercentage"
            value={minApprovalPercentage}
            onChange={(e) => setMinApprovalPercentage(e.target.value)}
            className="w-full border-b-2 border-gray-800 px-2 py-1 focus:outline-none"
          />
          {minApprovalError && (
            <div className="text-red-600 text-sm mt-1">{minApprovalError}</div>
          )}
        </div>
        {saveError && (
          <div className="mb-3 text-red-600 text-sm">{saveError}</div>
        )}
        <button
          onClick={saveRule}
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default SetRules;
 */
