import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function AdminPanel() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    clothing: 0,
    availableClothing: 0,
    swaps: 0,
    completedSwaps: 0,
    pendingSwaps: 0,
  });

  const [users, setUsers] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [swaps, setSwaps] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  // =========================================
  // GET CURRENT USER
  // =========================================

  const getCurrentUser = () => {
    try {
      const storedUser =
        localStorage.getItem("user");

      if (!storedUser) {
        return null;
      }

      return JSON.parse(storedUser);
    } catch (err) {
      console.error(
        "Failed to read user:",
        err
      );

      return null;
    }
  };

  // =========================================
  // SHOW MESSAGE
  // =========================================

  const showMessage = (
    text,
    type = "success"
  ) => {
    if (type === "error") {
      setError(text);
      setMessage("");
    } else {
      setMessage(text);
      setError("");
    }

    setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);
  };

  // =========================================
  // FETCH ADMIN DATA
  // =========================================

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        statsResponse,
        usersResponse,
        clothingResponse,
        swapsResponse,
      ] = await Promise.all([
        API.get("/admin/stats"),
        API.get("/admin/users"),
        API.get("/admin/clothing"),
        API.get("/admin/swaps"),
      ]);

      setStats(
        statsResponse.data || {}
      );

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );

      setClothes(
        Array.isArray(
          clothingResponse.data
        )
          ? clothingResponse.data
          : []
      );

      setSwaps(
        Array.isArray(swapsResponse.data)
          ? swapsResponse.data
          : []
      );
    } catch (err) {
      console.error(
        "Admin data error:",
        err
      );

      if (
        err.response?.status === 401
      ) {
        localStorage.removeItem(
          "token"
        );

        localStorage.removeItem(
          "user"
        );

        navigate("/login");

        return;
      }

      if (
        err.response?.status === 403
      ) {
        setError(
          err.response?.data?.message ||
            "Admin access required"
        );

        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load admin data"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // ADMIN AUTH CHECK
  // =========================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    const user = getCurrentUser();

    if (!token || !user) {
      navigate("/login");
      return;
    }

    if (user.role !== "admin") {
      navigate("/");
      return;
    }

    fetchAdminData();
  }, [navigate]);

  // =========================================
  // UPDATE USER ROLE
  // =========================================

  const updateUserRole = async (
    userId,
    currentRole,
    userName
  ) => {
    const newRole =
      currentRole === "admin"
        ? "user"
        : "admin";

    const confirmed =
      window.confirm(
        `Are you sure you want to change ${userName}'s role to ${newRole}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response =
        await API.patch(
          `/admin/users/${userId}/role`,
          {
            role: newRole,
          }
        );

      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                role:
                  response.data.user
                    .role,
              }
            : user
        )
      );

      showMessage(
        `User role updated to ${newRole}`
      );
    } catch (err) {
      console.error(
        "Update role error:",
        err
      );

      showMessage(
        err.response?.data?.message ||
          "Failed to update user role",
        "error"
      );
    }
  };

  // =========================================
  // DELETE USER
  // =========================================

  const deleteUser = async (
    userId,
    userName
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${userName}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/admin/users/${userId}`
      );

      setUsers((previousUsers) =>
        previousUsers.filter(
          (user) =>
            user._id !== userId
        )
      );

      showMessage(
        "User deleted successfully"
      );

      const statsResponse =
        await API.get(
          "/admin/stats"
        );

      setStats(
        statsResponse.data
      );
    } catch (err) {
      console.error(
        "Delete user error:",
        err
      );

      showMessage(
        err.response?.data?.message ||
          "Failed to delete user",
        "error"
      );
    }
  };

  // =========================================
  // DELETE CLOTHING
  // =========================================

  const deleteClothing = async (
    clothingId
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this clothing listing?\n\nThis action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      await API.delete(
        `/admin/clothing/${clothingId}`
      );

      setClothes(
        (previousClothes) =>
          previousClothes.filter(
            (item) =>
              item._id !== clothingId
          )
      );

      showMessage(
        "Clothing listing deleted successfully"
      );

      const statsResponse =
        await API.get(
          "/admin/stats"
        );

      setStats(
        statsResponse.data
      );
    } catch (err) {
      console.error(
        "Delete clothing error:",
        err
      );

      showMessage(
        err.response?.data?.message ||
          "Failed to delete clothing listing",
        "error"
      );
    }
  };

  // =========================================
  // STATUS CLASS
  // =========================================

  const getSwapStatusClass = (
    status
  ) => {
    switch (status) {
      case "Completed":
        return "admin-status completed";

      case "Accepted":
        return "admin-status accepted";

      case "Pending":
        return "admin-status pending";

      case "Rejected":
        return "admin-status rejected";

      case "Cancelled":
        return "admin-status cancelled";

      case "Negotiating":
        return "admin-status negotiating";

      default:
        return "admin-status";
    }
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">

          <div className="admin-spinner"></div>

          <h2>
            Loading Admin Panel
          </h2>

          <p>
            Preparing your dashboard...
          </p>

        </div>
      </div>
    );
  }

  // =========================================
  // CURRENT USER
  // =========================================

  const currentUser =
    getCurrentUser();

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="admin-page">

      {/* =====================================
          ADMIN HEADER
      ===================================== */}

      <header className="admin-top-header">

        <div className="admin-brand">

          <div className="admin-brand-icon">
            🛡️
          </div>

          <div>
            <span>
              KNR CLOTHING
            </span>

            <h1>
              Admin Panel
            </h1>
          </div>

        </div>

        <div className="admin-header-actions">

          <div className="admin-user-info">
            <strong>
              {currentUser?.name ||
                "Administrator"}
            </strong>

            <span>
              Administrator
            </span>
          </div>

          <button
            className="admin-dashboard-button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            Dashboard
          </button>

        </div>

      </header>

      {/* =====================================
          MESSAGES
      ===================================== */}

      {message && (
        <div className="admin-alert success">
          <span>✓</span>
          {message}

          <button
            onClick={() =>
              setMessage("")
            }
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="admin-alert error">
          <span>⚠️</span>
          {error}

          <button
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <div className="admin-navigation">

        <button
          className={
            activeSection ===
            "overview"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "overview"
            )
          }
        >
          📊 Overview
        </button>

        <button
          className={
            activeSection ===
            "users"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "users"
            )
          }
        >
          👥 Users
        </button>

        <button
          className={
            activeSection ===
            "clothing"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "clothing"
            )
          }
        >
          👕 Clothing
        </button>

        <button
          className={
            activeSection ===
            "swaps"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveSection(
              "swaps"
            )
          }
        >
          🔄 Swaps
        </button>

      </div>

      {/* =====================================
          OVERVIEW
      ===================================== */}

      {activeSection ===
        "overview" && (
        <section className="admin-overview">

          <div className="admin-welcome">

            <div>
              <span>
                ADMIN DASHBOARD
              </span>

              <h2>
                Welcome back,
                {" "}
                {currentUser?.name ||
                  "Administrator"}
                !
              </h2>

              <p>
                Monitor your KNR Clothing
                marketplace from one place.
              </p>
            </div>

            <div className="admin-welcome-icon">
              🛍️
            </div>

          </div>

          {/* STATISTICS */}

          <div className="admin-stats-grid">

            <div className="admin-stat-card users-stat">

              <div className="admin-stat-icon">
                👥
              </div>

              <div>
                <span>
                  Total Users
                </span>

                <strong>
                  {stats.users || 0}
                </strong>
              </div>

            </div>

            <div className="admin-stat-card clothing-stat">

              <div className="admin-stat-icon">
                👕
              </div>

              <div>
                <span>
                  Total Clothing
                </span>

                <strong>
                  {stats.clothing ||
                    0}
                </strong>
              </div>

            </div>

            <div className="admin-stat-card available-stat">

              <div className="admin-stat-icon">
                🟢
              </div>

              <div>
                <span>
                  Available
                </span>

                <strong>
                  {stats.availableClothing ||
                    0}
                </strong>
              </div>

            </div>

            <div className="admin-stat-card swaps-stat">

              <div className="admin-stat-icon">
                🔄
              </div>

              <div>
                <span>
                  Total Swaps
                </span>

                <strong>
                  {stats.swaps || 0}
                </strong>
              </div>

            </div>

            <div className="admin-stat-card completed-stat">

              <div className="admin-stat-icon">
                ✓
              </div>

              <div>
                <span>
                  Completed
                </span>

                <strong>
                  {stats.completedSwaps ||
                    0}
                </strong>
              </div>

            </div>

            <div className="admin-stat-card pending-stat">

              <div className="admin-stat-icon">
                ⏳
              </div>

              <div>
                <span>
                  Pending Swaps
                </span>

                <strong>
                  {stats.pendingSwaps ||
                    0}
                </strong>
              </div>

            </div>

          </div>

          {/* QUICK ACTIONS */}

          <div className="admin-quick-section">

            <h2>
              Quick Management
            </h2>

            <div className="admin-quick-grid">

              <button
                onClick={() =>
                  setActiveSection(
                    "users"
                  )
                }
              >
                <span>👥</span>

                <div>
                  <strong>
                    Manage Users
                  </strong>

                  <small>
                    View and manage
                    accounts
                  </small>
                </div>

                <b>→</b>
              </button>

              <button
                onClick={() =>
                  setActiveSection(
                    "clothing"
                  )
                }
              >
                <span>👕</span>

                <div>
                  <strong>
                    Manage Clothing
                  </strong>

                  <small>
                    Review marketplace
                    listings
                  </small>
                </div>

                <b>→</b>
              </button>

              <button
                onClick={() =>
                  setActiveSection(
                    "swaps"
                  )
                }
              >
                <span>🔄</span>

                <div>
                  <strong>
                    Monitor Swaps
                  </strong>

                  <small>
                    Track swap activity
                  </small>
                </div>

                <b>→</b>
              </button>

            </div>

          </div>

        </section>
      )}

      {/* =====================================
          USERS
      ===================================== */}

      {activeSection ===
        "users" && (
        <section className="admin-data-section">

          <div className="admin-data-header">

            <div>
              <span>
                USER MANAGEMENT
              </span>

              <h2>
                Users
              </h2>

              <p>
                Manage marketplace accounts
                and administrator access.
              </p>
            </div>

            <div className="admin-section-count">
              {users.length} users
            </div>

          </div>

          <div className="admin-table-container">

            <table className="admin-modern-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Location</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {users.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="admin-empty-cell"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map(
                    (user) => {

                      const currentUserId =
                        String(
                          currentUser?.id ||
                            currentUser?._id ||
                            ""
                        );

                      const isCurrentUser =
                        String(
                          user._id
                        ) ===
                        currentUserId;

                      return (
                        <tr
                          key={
                            user._id
                          }
                        >

                          <td>
                            <div className="admin-user-cell">

                              <div className="admin-avatar">
                                {user.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  "U"}
                              </div>

                              <div>
                                <strong>
                                  {user.name}
                                </strong>

                                <small>
                                  {user.email}
                                </small>
                              </div>

                            </div>
                          </td>

                          <td>
                            {user.location ||
                              "Not provided"}
                          </td>

                          <td>

                            <span
                              className={
                                user.role ===
                                "admin"
                                  ? "admin-role-badge"
                                  : "user-role-badge"
                              }
                            >
                              {user.role ===
                              "admin"
                                ? "Admin"
                                : "User"}
                            </span>

                          </td>

                          <td>
                            {user.createdAt
                              ? new Date(
                                  user.createdAt
                                ).toLocaleDateString()
                              : "-"}
                          </td>

                          <td>

                            {isCurrentUser ? (

                              <span className="current-admin-badge">
                                Current Admin
                              </span>

                            ) : (

                              <div className="admin-row-actions">

                                <button
                                  className="role-action-button"
                                  onClick={() =>
                                    updateUserRole(
                                      user._id,
                                      user.role,
                                      user.name
                                    )
                                  }
                                >
                                  {user.role ===
                                  "admin"
                                    ? "Remove Admin"
                                    : "Make Admin"}
                                </button>

                                <button
                                  className="delete-action-button"
                                  onClick={() =>
                                    deleteUser(
                                      user._id,
                                      user.name
                                    )
                                  }
                                >
                                  Delete
                                </button>

                              </div>

                            )}

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>
      )}

      {/* =====================================
          CLOTHING
      ===================================== */}

      {activeSection ===
        "clothing" && (
        <section className="admin-data-section">

          <div className="admin-data-header">

            <div>
              <span>
                MARKETPLACE MANAGEMENT
              </span>

              <h2>
                Clothing Listings
              </h2>

              <p>
                Review and manage clothing
                listed on the marketplace.
              </p>
            </div>

            <div className="admin-section-count">
              {clothes.length} listings
            </div>

          </div>

          <div className="admin-table-container">

            <table className="admin-modern-table">

              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Size</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {clothes.length ===
                0 ? (

                  <tr>
                    <td
                      colSpan="7"
                      className="admin-empty-cell"
                    >
                      No clothing listings
                      found.
                    </td>
                  </tr>

                ) : (

                  clothes.map(
                    (item) => (

                      <tr
                        key={
                          item._id
                        }
                      >

                        <td>
                          <div className="admin-item-cell">

                            {item.image ? (
                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  item.title
                                }
                                onError={(
                                  e
                                ) => {
                                  e.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <div className="admin-item-placeholder">
                                👕
                              </div>
                            )}

                            <strong>
                              {item.title}
                            </strong>

                          </div>
                        </td>

                        <td>
                          {item.category}
                        </td>

                        <td>
                          {item.size}
                        </td>

                        <td>
                          {item.condition}
                        </td>

                        <td>
                          <span className="listing-status">
                            {item.status ||
                              "Available"}
                          </span>
                        </td>

                        <td>
                          {item.owner?.name ||
                            "Unknown"}
                        </td>

                        <td>
                          <button
                            className="delete-action-button"
                            onClick={() =>
                              deleteClothing(
                                item._id
                              )
                            }
                          >
                            Delete
                          </button>
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>
      )}

      {/* =====================================
          SWAPS
      ===================================== */}

      {activeSection ===
        "swaps" && (
        <section className="admin-data-section">

          <div className="admin-data-header">

            <div>
              <span>
                MARKETPLACE ACTIVITY
              </span>

              <h2>
                Swap Requests
              </h2>

              <p>
                Monitor clothing swap activity
                across the marketplace.
              </p>
            </div>

            <div className="admin-section-count">
              {swaps.length} swaps
            </div>

          </div>

          <div className="admin-table-container">

            <table className="admin-modern-table">

              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Owner</th>
                  <th>Offered</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>

                {swaps.length ===
                0 ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="admin-empty-cell"
                    >
                      No swap requests
                      found.
                    </td>
                  </tr>

                ) : (

                  swaps.map(
                    (swap) => (

                      <tr
                        key={
                          swap._id
                        }
                      >

                        <td>
                          {swap.requester
                            ?.name ||
                            "Unknown"}
                        </td>

                        <td>
                          {swap.owner
                            ?.name ||
                            "Unknown"}
                        </td>

                        <td>
                          {swap.offeredClothing
                            ?.title ||
                            "Deleted item"}
                        </td>

                        <td>
                          {swap.requestedClothing
                            ?.title ||
                            "Deleted item"}
                        </td>

                        <td>

                          <span
                            className={getSwapStatusClass(
                              swap.status
                            )}
                          >
                            {swap.status}
                          </span>

                        </td>

                        <td>
                          {swap.createdAt
                            ? new Date(
                                swap.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>
      )}

    </div>
  );
}

export default AdminPanel;