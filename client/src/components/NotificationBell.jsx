import { useEffect, useState } from "react";
import API from "../services/api";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // ==============================
  // FETCH NOTIFICATIONS
  // ==============================
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await API.get("/notifications");

      // Backend returns:
      // { notifications: [...] }

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data.notifications)
        ? response.data.notifications
        : [];

      setNotifications(data);

      const unread = data.filter(
        (notification) => !notification.read
      ).length;

      setUnreadCount(unread);

    } catch (error) {
      console.error(
        "Failed to fetch notifications:",
        error.response?.data || error.message
      );
    }
  };

  // ==============================
  // LOAD NOTIFICATIONS ON START
  // ==============================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      fetchNotifications();
    }
  }, []);

  // ==============================
  // MARK ONE AS READ
  // ==============================
  const markAsRead = async (id) => {
    try {
      await API.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );

    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error.response?.data || error.message
      );
    }
  };

  // ==============================
  // MARK ALL AS READ
  // ==============================
  const markAllAsRead = async (event) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      await API.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);

    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error.response?.data || error.message
      );
    }
  };

  // ==============================
  // DELETE NOTIFICATION
  // ==============================
  const deleteNotification = async (id, event) => {
    if (event) {
      event.stopPropagation();
    }

    try {
      const notification = notifications.find(
        (item) => item._id === id
      );

      await API.delete(`/notifications/${id}`);

      setNotifications((previous) =>
        previous.filter(
          (item) => item._id !== id
        )
      );

      if (notification && !notification.read) {
        setUnreadCount((previous) =>
          Math.max(0, previous - 1)
        );
      }

    } catch (error) {
      console.error(
        "Failed to delete notification:",
        error.response?.data || error.message
      );
    }
  };

  // ==============================
  // CLICK NOTIFICATION
  // ==============================
  const handleNotificationClick = async (
    notification
  ) => {
    try {
      if (!notification.read) {
        await markAsRead(notification._id);
      }

    } catch (error) {
      console.error(
        "Notification click error:",
        error
      );
    }
  };

  // ==============================
  // NOTIFICATION ICON
  // ==============================
  const getNotificationIcon = (type) => {
    switch (type) {
      case "SWAP_REQUEST":
        return "🔄";

      case "SWAP_ACCEPTED":
        return "✅";

      case "SWAP_REJECTED":
        return "❌";

      case "SWAP_COMPLETED":
        return "🎉";

      case "SWAP_CANCELLED":
        return "🚫";

      case "NEW_MESSAGE":
        return "💬";

      default:
        return "🔔";
    }
  };

  // ==============================
  // BELL + DROPDOWN
  // ==============================
  return (
    <div className="notification-container">

      {/* Notification Bell */}
      <button
        type="button"
        className="notification-button"
        title="Notifications"
        onClick={() => {
          const newState =
            !showNotifications;

          setShowNotifications(newState);

          // Refresh when opening
          if (newState) {
            fetchNotifications();
          }
        }}
      >
        🔔

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="notification-dropdown">

          {/* Header */}
          <div className="notification-header">

            <h3>
              Notifications
            </h3>

            {unreadCount > 0 && (
              <button
                type="button"
                className="mark-all-button"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}

          </div>

          {/* No Notifications */}
          {notifications.length === 0 ? (
            <div className="no-notifications">

              <div className="empty-icon">
                🔔
              </div>

              <p>
                No notifications
              </p>

              <small>
                You will see swap updates here.
              </small>

            </div>
          ) : (

            /* Notification List */
            <div className="notification-list">

              {notifications.map(
                (notification) => (

                  <div
                    key={notification._id}
                    className={`notification-item ${
                      !notification.read
                        ? "unread"
                        : ""
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification
                      )
                    }
                  >

                    {/* Icon */}
                    <div className="notification-icon">
                      {getNotificationIcon(
                        notification.type
                      )}
                    </div>

                    {/* Content */}
                    <div className="notification-content">

                      <strong>
                        {notification.title ||
                          "Notification"}
                      </strong>

                      <p>
                        {notification.message ||
                          ""}
                      </p>

                      {/* Sender */}
                      {notification.sender?.name && (
                        <small>
                          From:{" "}
                          {notification.sender.name}
                        </small>
                      )}

                      {/* Date */}
                      <small>
                        {notification.createdAt
                          ? new Date(
                              notification.createdAt
                            ).toLocaleString()
                          : ""}
                      </small>

                    </div>

                    {/* Delete */}
                    <button
                      type="button"
                      className="notification-delete"
                      title="Delete notification"
                      onClick={(event) =>
                        deleteNotification(
                          notification._id,
                          event
                        )
                      }
                    >
                      ×
                    </button>

                  </div>

                )
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default NotificationBell;