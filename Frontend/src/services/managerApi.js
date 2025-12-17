import axios from "axios";
import { BASE_URL } from "../config/urlconfig";

const API_BASE_URL = `${BASE_URL}/expenses`;

const managerApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
managerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("Manager API token:", token ? "present" : "missing");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getManagerExpenses = async (status) => {
  try {
    const url = status ? `/manager?status=${status}` : "/manager";
    const response = await managerApi.get(url);
    console.log(
      "Fetched manager expenses (status=",
      status,
      "):",
      response.data
    );
    return response.data;
  } catch (error) {
    console.error("Failed to fetch manager expenses", error);
    throw error;
  }
};

export const getPendingExpenses = async () => {
  return getManagerExpenses("pending");
};

export const approveExpense = async (id) => {
  try {
    const response = await managerApi.patch(`/${id}/status`, {
      status: "approved",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to approve expense", error);
    throw error;
  }
};

export const rejectExpense = async (id) => {
  try {
    const response = await managerApi.patch(`/${id}/status`, {
      status: "rejected",
    });
    return response.data;
  } catch (error) {
    console.error("Failed to reject expense", error);
    throw error;
  }
};
