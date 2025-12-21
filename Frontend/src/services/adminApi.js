import axios from "axios";
import { BASE_URL } from "../config/urlconfig";

function getAuthHeader() {
  const token = localStorage.getItem("token");
    console.log(token);

  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Users
export async function fetchUsers() {
  const res = await axios.get(`${BASE_URL}/users/allusers`, {
    headers: getAuthHeader(),
  });
  return res.data;
}

export async function fetchUser(userId) {
  const res = await axios.get(`${BASE_URL}/users/${userId}`, {
    headers: getAuthHeader(),
  });
  return res.data;
}

export async function createUser(payload) {
  const res = await axios.post(`${BASE_URL}/users/createuser`, payload, {
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
  });
  return res.data;
}

export async function updateUser(userId, updates) {
  const res = await axios.put(
    `${BASE_URL}/users/updateuser/${userId}`,
    updates,
    {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    }
  );
  return res.data;
}

export async function sendPassword(userId) {
  const res = await axios.post(
    `${BASE_URL}/users/sendpassword/${userId}`,
    {},
    {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    }
  );
  return res.data;
}

// Categories
export async function fetchCategories() {
  const res = await axios.get(`${BASE_URL}/categories/getcategory`, {
    headers: getAuthHeader(),
  });
  return res.data;
}

export async function createCategory(payload) {
  const res = await axios.post(`${BASE_URL}/categories/create`, payload, {
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
  });
  return res.data;
}

export async function updateCategory(categoryId, updates) {
  const res = await axios.put(
    `${BASE_URL}/categories/update/${categoryId}`,
    updates,
    {
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    }
  );
  return res.data;
}

// Admin expenses (approve/reject/list)
export async function getAdminExpenses(status) {
  const url = status
    ? `${BASE_URL}/expenses/admin?status=${status}`
    : `${BASE_URL}/expenses/admin`;
  const res = await axios.get(url, { headers: getAuthHeader() });
  return res.data;
}

export async function updateExpenseStatus(expenseId, status) {
  const res = await axios.patch(
    `${BASE_URL}/expenses/${expenseId}/status`,
    { status },
    { headers: { "Content-Type": "application/json", ...getAuthHeader() } }
  );
  return res.data;
}

// Admin action: proceed payment (finalize by admin)
export async function approveExpense(expenseId) {
  // alias kept for existing UI: will mark as payment_proceed
  return updateExpenseStatus(expenseId, "payment_proceed");
}

export async function rejectExpense(expenseId) {
  // alias kept for existing UI: will mark as declined
  return updateExpenseStatus(expenseId, "declined");
}

// explicit helpers
export async function paymentProceedExpense(expenseId) {
  return updateExpenseStatus(expenseId, "payment_proceed");
}

export async function declineExpense(expenseId) {
  return updateExpenseStatus(expenseId, "declined");
}
