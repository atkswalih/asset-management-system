import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Box,
  Search,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [notifications, setNotifications] =
    useState([]);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const notificationRef = useRef(null);

  useEffect(() => {
    const loadNavbarData = async () => {
      try {
        const [
          userResponse,
          ticketsResponse,
          inventoryResponse,
        ] = await Promise.all([
          api.get("auth/me/"),
          api.get("tickets/"),
          api.get("inventory/"),
        ]);

        setUser(userResponse.data);

        const tickets =
          ticketsResponse.data.results ??
          ticketsResponse.data;

        const inventory =
          inventoryResponse.data.results ??
          inventoryResponse.data;

        const newNotifications = [];

        tickets
          .filter(
            (ticket) =>
              ticket.status === "OPEN" ||
              ticket.status === "IN_PROGRESS",
          )
          .slice(0, 5)
          .forEach((ticket) => {
            newNotifications.push({
              id: `ticket-${ticket.id}`,
              type: "ticket",
              title: "Repair ticket",
              message: `${ticket.asset_name} needs attention.`,
              time: ticket.status_display,
            });
          });

        inventory
          .filter(
            (item) => item.is_low_stock,
          )
          .slice(0, 5)
          .forEach((item) => {
            newNotifications.push({
              id: `inventory-${item.id}`,
              type: "inventory",
              title: "Low stock",
              message: `${item.item_type} is running low.`,
              time: `${item.quantity} remaining`,
            });
          });

        setNotifications(
          newNotifications.slice(0, 8),
        );
      } catch (error) {
        console.error(
          "Navbar data error:",
          error,
        );
      }
    };

    loadNavbarData();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target,
        )
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  const fullName =
    user?.full_name ||
    user?.username ||
    "User";

  const role =
    user?.role === "ADMIN"
      ? "Administrator"
      : "Employee";

  const initials = fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar-search">
        <Search size={19} />

        <input
          placeholder="Search anything..."
        />
      </div>

      <div className="navbar-right">
        <div
          className="notification-wrapper"
          ref={notificationRef}
        >
          <button
            type="button"
            className="icon-button"
            onClick={() =>
              setShowNotifications(
                (current) => !current,
              )
            }
            title="Notifications"
          >
            <Bell size={20} />

            {notifications.length > 0 && (
              <span className="notification-count">
                {notifications.length > 9
                  ? "9+"
                  : notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-panel">
              <div className="notification-header">
                <div>
                  <h3>Notifications</h3>

                  <span>
                    {notifications.length} active
                  </span>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <Bell size={24} />

                  <strong>
                    You're all caught up
                  </strong>

                  <span>
                    No new notifications.
                  </span>
                </div>
              ) : (
                <div className="notification-list">
                  {notifications.map(
                    (notification) => {
                      const isTicket =
                        notification.type ===
                        "ticket";

                      return (
                        <div
                          className="notification-item"
                          key={
                            notification.id
                          }
                        >
                          <div
                            className={`notification-icon ${
                              isTicket
                                ? "ticket"
                                : "inventory"
                            }`}
                          >
                            {isTicket ? (
                              <Wrench size={17} />
                            ) : (
                              <Box size={17} />
                            )}
                          </div>

                          <div className="notification-content">
                            <strong>
                              {
                                notification.title
                              }
                            </strong>

                            <p>
                              {
                                notification.message
                              }
                            </p>

                            <span>
                              {
                                notification.time
                              }
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="navbar-profile-button"
          onClick={() =>
            navigate("/profile")
          }
          title="Open profile"
        >
          <div className="user-area">
            <div className="user-avatar">
              {initials}
            </div>

            <div className="user-info">
              <strong>{fullName}</strong>

              <span>{role}</span>
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}

export default Navbar;