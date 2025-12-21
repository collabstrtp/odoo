import React, { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { Menu, X, LayoutDashboard, Lock, LogOut, Send } from "lucide-react";
import MobileSidebar from "./MobileSidebar";
import { getProfile, logout } from "../../services/authApi";
const menuItems = [
  { label: "Dashboard", icon: <LayoutDashboard />, path: "/admin" },
  { label: "Approvals", icon: <Send />, path: "/admin/approvals" },
  { label: "Change Password", icon: <Lock />, path: "/admin/change-password" },
];

export default function Layout() {
  const location = useLocation();
  const showSidebar = location.pathname !== "/";

  const [userName, setUserName] = useState("Username");
  const [userEmail, setUserEmail] = useState("user@example.com");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const profile = await getProfile();
        if (profile && profile.user) {
          setUserName(profile.user.name);
          setUserEmail(profile.user.email);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    }
    fetchProfile();
  }, []);

  return (
    <>
      <MobileSidebar />

      <div className="h-screen bg-black p-5 pl-0 hidden md:block">
        <div className={`flex h-full bg-black rounded-2xl overflow-hidden`}>
          {showSidebar && (
            <aside className="w-70 bg-black text-white flex flex-col ">
              <div className="p-6 text-center border-b border-gray-700">
                <h2 className="text-sm font-semibold">{userName}</h2>
                <p className="text-xs text-gray-400">{userEmail}</p>
              </div>

              <nav className="flex-1 overflow-y-auto p-5  ">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2 transition-all
                  ${
                    location.pathname === item.path
                      ? "bg-white text-blue-600 font-semibold rounded-full"
                      : "text-white hover:bg-gray-800 rounded-lg"
                  }
                `}
                  >
                    <span
                      className={`text-lg ${
                        location.pathname === item.path
                          ? "text-blue-600"
                          : "text-white"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="p-5 border-t border-gray-700">
                <button
                  onClick={() => {
                    logout();
                    window.location.href = "/";
                  }}
                  className="flex items-center gap-3 px-4 py-2 w-full text-left text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                  <LogOut className="text-lg" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </aside>
          )}

          <div className="flex-grow p-6 bg-white rounded-2xl overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
