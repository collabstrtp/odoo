import React, { useEffect, useState } from "react";
import { Plus, Send, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  createUser,
  updateUser,
  sendPassword as sendPasswordApi,
} from "../../services/adminApi";

const Dashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    role: "Employee",
    manager: "",
    email: "",
  });

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (e) {
        // silently fail
      }
    }
    loadUsers();
  }, []);

  const addUser = async () => {
    if (!newUser.name || !newUser.email) return;
    try {
      const payload = {
        name: newUser.name,
        email: newUser.email,
        role:
          newUser.role?.toLowerCase() === "manager" ? "manager" : "employee",
        password: Math.random().toString(36).slice(-8),
      };

      // Only send manager if it's a valid MongoDB ObjectId
      const managerValue = (newUser.manager || "").trim();
      const isValidObjectId = /^[a-f\d]{24}$/i.test(managerValue);
      if (isValidObjectId) {
        payload.manager = managerValue;
      }

      const created = await createUser(payload);
      setUsers((prev) => [...prev, created]);
      setNewUser({ name: "", role: "Employee", manager: "", email: "" });
      setShowNewUser(false);
    } catch (e) {
      // silently fail
    }
  };

  const sendPassword = async (user) => {
    try {
      await sendPasswordApi(user._id || user.id);
      alert(`Password sent to ${user.email}`);
    } catch (error) {
      alert("Failed to send password");
    }
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (e) {
      console.error("Failed to update role", e);
    }
  };

  const handleManagerUpdate = async (userId, managerId) => {
    try {
      await updateUser(userId, { manager: managerId || null });
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === userId ? { ...u, manager: managerId } : u
        )
      );
    } catch (e) {
      console.error("Failed to update manager", e);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white border-2 border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setShowNewUser(true)}
            className="px-4 py-2 bg-white border-2 border-gray-800 rounded hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus size={16} /> New
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-800">
                <th className="text-left p-2 font-semibold">User</th>
                <th className="text-left p-2 font-semibold">Role</th>
                <th className="text-left p-2 font-semibold">Manager</th>
                <th className="text-left p-2 font-semibold">Email</th>

                <th className="text-left p-2 font-semibold">Password</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user._id || user.id}
                  className="border-b border-gray-300"
                >
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">
                    <select
                      className="border border-gray-300 rounded px-2 py-1"
                      value={user.role}
                      onChange={(e) =>
                        handleRoleUpdate(user._id || user.id, e.target.value)
                      }
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      className="border border-gray-300 rounded px-2 py-1"
                      value={user.manager?._id || user.manager || ""}
                      onChange={(e) =>
                        handleManagerUpdate(user._id || user.id, e.target.value)
                      }
                    >
                      <option value="">No Manager</option>
                      {users
                        .filter(
                          (u) => u.role === "manager" || u.role === "admin"
                        )
                        .map((m) => (
                          <option key={m._id || m.id} value={m._id || m.id}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="p-2">{user.email}</td>

                  <td className="p-2">
                    <button
                      onClick={() => sendPassword(user)}
                      className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
                    >
                      Send password
                    </button>
                  </td>
                </tr>
              ))}
              {showNewUser && (
                <tr
                  key="new-user"
                  className="border-b border-gray-300 bg-gray-50"
                >
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Name"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                    >
                      <option>Manager</option>
                      <option>Employee</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      placeholder="Manager"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={newUser.manager}
                      onChange={(e) =>
                        setNewUser({ ...newUser, manager: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="email"
                      placeholder="Email"
                      className="border border-gray-300 rounded px-2 py-1 w-full"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={addUser}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowNewUser(false)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
