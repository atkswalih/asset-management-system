import { useEffect, useState } from "react";
import {
  BarChart3,
  Box,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UserRound,
  UsersRound,
  Wrench,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import api from "../services/api";

function Sidebar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("auth/me/");

        setUser(response.data);
      } catch (error) {
        console.error("Sidebar user error:", error);
      }
    };

    loadUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/login");
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Assets",
      path: "/assets",
      icon: Box,
    },
    {
      name: "Inventory",
      path: "/inventory",
      icon: ClipboardList,
    },
    {
      name: "Assignments",
      path: "/assignments",
      icon: UserRound,
    },
    {
      name: "Repair Tickets",
      path: "/tickets",
      icon: Wrench,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-box">
          <BarChart3 size={21} />
        </div>

        <div>
          <h2>AssetFlow</h2>

          <span>Management System</span>
        </div>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} />

                <span>{item.name}</span>
              </NavLink>
            );
          })}

          {user?.role === "ADMIN" && (
            <>
              <p className="sidebar-label sidebar-admin-label">
                ADMINISTRATION
              </p>

              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
              >
                <UsersRound size={19} />

                <span>User Management</span>
              </NavLink>
            </>
          )}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <Settings size={19} />

          <span>Profile</span>
        </NavLink>

        <NavLink
          to="/ai-assistant"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <Sparkles size={19} />

          <span>AI Assistant</span>
        </NavLink>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={19} />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;