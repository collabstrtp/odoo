import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./Pages/Auth/Login";
import SignUp from "./Pages/Auth/Signup";
import ChangePassword from "./Pages/Auth/ChangePassword";

// Admin Pages
import Layout from "./Pages/Admin/Layout";
import Dashboard from "./Pages/Admin/Dashboard";
import Approvals from "./Pages/Admin/Approvals";

//manager pages
import ManagerLayout from "./Pages/Manager/ManagerLayout";
import ManagerDashboard from "./Pages/Manager/ManagerDashboard";

//employee pages
import EmpLayout from "./Pages/Employee/EmpLayout";
import EmpDashboard from "./Pages/Employee/EmpDashboard";
import ForgotPswd from "./Pages/Auth/ForgotPswd";

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgotpassword" element={<ForgotPswd />} />
        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={[1]} />}>
          <Route path="/admin" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={[2]} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route index element={<ManagerDashboard />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={[3]} />}>
          <Route path="/employee" element={<EmpLayout />}>
            <Route index element={<EmpDashboard />} />
            <Route path="dashboard" element={<EmpDashboard />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
