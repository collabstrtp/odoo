import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", icon: <LayoutDashboard />, path: "/dashboard" },
];

const MobileSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleLogout = () => {
    // Dispatch your logout action here
    // Example: dispatch(logout());

    // Clear any stored tokens
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Close sidebar
    setIsOpen(false);

    // Navigate to login page
    navigate("/login");
  };
  return (
    <div className="md:hidden">
      {/* Topbar */}
      <div className="bg-black text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{user.name}</h2>
        <Menu className="cursor-pointer" onClick={() => setIsOpen(true)} />
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50  bg-opacity-90 backdrop-blur-sm transition duration-300">
          <div className="w-64 bg-black h-full p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 text-white">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <X onClick={() => setIsOpen(false)} className="cursor-pointer" />
            </div>

            <p className="text-xs text-gray-400 mb-4">{user.email}</p>

            <nav className="flex flex-col gap-2 flex-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-all ${
                    location.pathname === item.path
                      ? "bg-white text-blue-600 font-semibold rounded-full"
                      : "text-white hover:bg-gray-800 rounded-lg"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Logout Button */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-red-600 hover:bg-opacity-20 rounded-lg transition-all w-full"
              >
                <LogOut className="text-lg" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-grow p-6 bg-white rounded-2xl">
        <Outlet />
      </div>
    </div>
  );
};

export default MobileSidebar;
