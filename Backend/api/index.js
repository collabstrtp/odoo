import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { fileURLToPath } from "url";
import path from "path";
import connectDB from "../db/db.js";
dotenv.config();
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import companyRoutes from "./companyRoutes.js";
import expenseRoutes from "./expenseRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
/* import approvalActionRoutes from "./approvalActionRoutes.js";
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());
connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to Expense Manager server");
});

app.use("/auth", authRoutes);
app.use("/company", companyRoutes);
app.use("/users", userRoutes);
app.use("/expenses", expenseRoutes);
app.use("/categories", categoryRoutes);
/* app.use("/approvalactions", approvalActionRoutes);
 */ const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
