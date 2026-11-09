
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Dashboard() {
  const navigate = useNavigate();

  const [clothes, setClothes] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user") || "null"
    );
  } catch {
    currentUser = null;
  }

  const currentUserId = currentUser?._id || currentUser?.id;

  // =========================================
  // FETCH DASHBOARD DATA
  // =========================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const [clothingResponse, swapResponse] =
          await Promise.all([
            API.get("/clothes"),
            API.get("/swaps"),
          ]);

        const allClothes = Array.isArray(clothingResponse.data)
          ? clothingResponse.data
          : [];

        const allSwaps = Array.isArray(swapResponse.data)
          ? swapResponse.data
          : [];

        const myClothes = allClothes.filter((item) => {
          const ownerId =
            item.owner?._id ||
            item.owner?.id ||
            item.owner;

          return String(ownerId) === String(currentUserId);
        });

        setClothes(myClothes);
        setSwaps(allSwaps);
      } catch (error) {
        console.error("Failed to load dashboard:", error);

        setMessage(
          error.response?.data?.message ||
            "Failed to load dashboard. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, currentUserId]);

  // =========================================
  // STATISTICS
  // =========================================

  const availableClothes = clothes.filter(
    (item) => item.status?.toLowerCase() === "available"
  );

  const activeSwaps = swaps.filter((swap) =>
    ["pending", "negotiating", "accepted"].includes(
      swap.status?.toLowerCase()
    )
  );

  const pendingSwaps = swaps.filter(
    (swap) => swap.status?.toLowerCase() === "pending"
  );

  const completedSwaps = swaps.filter(
    (swap) => swap.status?.toLowerCase() === "completed"
  );

  const recentClothes = [...clothes]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, 3);

  const recentSwaps = [...swaps]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    )
    .slice(0, 3);

  // =========================================
  // LOADING STATE
  // =========================================

  if (loading) {
    return (
      <main className="wl-dashboard-page">
        <div className="wl-dashboard-state">
          <div className="wl-loader" />
          <h2>Opening your wardrobe...</h2>
          <p>Getting everything ready for you.</p>
        </div>
      </main>
    );
  }

  // =========================================
  // DASHBOARD
  // =========================================

  return (
    <main className="wl-dashboard-page">
      <div className="wl-dashboard-container">

        {/* HEADER */}

        <section className="wl-dashboard-header">
          <div>
            <span className="wl-eyebrow">
              YOUR PERSONAL SPACE
            </span>

            <h1>
              Welcome back,
              <br />
              <span>{currentUser?.name || "Fashion lover"}.</span>
            </h1>

            <p>
              Your wardrobe, your swaps, your next favourite find.
              Everything in one place.
            </p>
          </div>

          <div className="wl-dashboard-header-actions">
            <button
              className="wl-button wl-button-dark"
              onClick={() => navigate("/add-clothing")}
            >
              + List clothing
            </button>

            <button
              className="wl-dashboard-outline-button"
              onClick={() => navigate("/")}
            >
              Explore marketplace ↗
            </button>
          </div>
        </section>

        {message && (
          <div className="wl-dashboard-alert" role="alert">
            {message}
          </div>
        )}

        {/* STATISTICS */}

        <section className="wl-dashboard-stats">
          <button
            className="wl-dashboard-stat"
            onClick={() => navigate("/my-clothing")}
          >
            <span className="wl-stat-number">
              {clothes.length}
            </span>
            <span className="wl-stat-label">
              MY LISTINGS
            </span>
            <span className="wl-stat-description">
              Pieces in your wardrobe
            </span>
            <span className="wl-stat-arrow">↗</span>
          </button>

          <button
            className="wl-dashboard-stat"
            onClick={() => navigate("/my-clothing")}
          >
            <span className="wl-stat-number">
              {availableClothes.length}
            </span>
            <span className="wl-stat-label">
              AVAILABLE
            </span>
            <span className="wl-stat-description">
              Ready to find a new home
            </span>
            <span className="wl-stat-arrow">↗</span>
          </button>

          <button
            className="wl-dashboard-stat"
            onClick={() => navigate("/swaps")}
          >
            <span className="wl-stat-number">
              {activeSwaps.length}
            </span>
            <span className="wl-stat-label">
              ACTIVE SWAPS
            </span>
            <span className="wl-stat-description">
              Exchanges in progress
            </span>
            <span className="wl-stat-arrow">↗</span>
          </button>

          <button
            className="wl-dashboard-stat"
            onClick={() => navigate("/swaps")}
          >
            <span className="wl-stat-number">
              {pendingSwaps.length}
            </span>
            <span className="wl-stat-label">
              PENDING
            </span>
            <span className="wl-stat-description">
              Waiting for a response
            </span>
            <span className="wl-stat-arrow">↗</span>
          </button>

          <button
            className="wl-dashboard-stat wl-stat-highlight"
            onClick={() => navigate("/swaps")}
          >
            <span className="wl-stat-number">
              {completedSwaps.length}
            </span>
            <span className="wl-stat-label">
              COMPLETED
            </span>
            <span className="wl-stat-description">
              Successful exchanges
            </span>
            <span className="wl-stat-arrow">↗</span>
          </button>
        </section>

        {/* QUICK ACTIONS */}

        <section className="wl-dashboard-actions-section">
          <div className="wl-dashboard-section-heading">
            <div>
              <span className="wl-eyebrow">
                MAKE SOMETHING HAPPEN
              </span>
              <h2>Quick actions.</h2>
            </div>
          </div>

          <div className="wl-dashboard-action-grid">
            <button
              className="wl-dashboard-action-card"
              onClick={() => navigate("/add-clothing")}
            >
              <span className="wl-action-icon">＋</span>
              <span>
                <strong>List a piece</strong>
                <small>Share something from your wardrobe</small>
              </span>
              <span className="wl-action-arrow">↗</span>
            </button>

            <button
              className="wl-dashboard-action-card"
              onClick={() => navigate("/")}
            >
              <span className="wl-action-icon">⌕</span>
              <span>
                <strong>Discover clothing</strong>
                <small>Find your next favourite piece</small>
              </span>
              <span className="wl-action-arrow">↗</span>
            </button>

            <button
              className="wl-dashboard-action-card"
              onClick={() => navigate("/swaps")}
            >
              <span className="wl-action-icon">↻</span>
              <span>
                <strong>Manage swaps</strong>
                <small>Review your exchange requests</small>
              </span>
              <span className="wl-action-arrow">↗</span>
            </button>

            <button
              className="wl-dashboard-action-card"
              onClick={() => navigate("/my-clothing")}
            >
              <span className="wl-action-icon">▤</span>
              <span>
                <strong>My wardrobe</strong>
                <small>Manage your clothing listings</small>
              </span>
              <span className="wl-action-arrow">↗</span>
            </button>
          </div>
        </section>

        {/* RECENT CLOTHING */}

        <section className="wl-dashboard-content-section">
          <div className="wl-dashboard-section-heading">
            <div>
              <span className="wl-eyebrow">
                YOUR LATEST ADDITIONS
              </span>
              <h2>Recently listed.</h2>
            </div>

            <button
              className="wl-dashboard-view-all"
              onClick={() => navigate("/my-clothing")}
            >
              View wardrobe ↗
            </button>
          </div>

          {recentClothes.length === 0 ? (
            <div className="wl-dashboard-empty">
              <span>＋</span>
              <h3>Your wardrobe starts here.</h3>
              <p>
                Add your first clothing piece and give it another story.
              </p>
              <button
                className="wl-button wl-button-dark"
                onClick={() => navigate("/add-clothing")}
              >
                Add your first piece
              </button>
            </div>
          ) : (
            <div className="wl-dashboard-clothing-grid">
              {recentClothes.map((item) => (
                <button
                  className="wl-dashboard-clothing-card"
                  key={item._id}
                  onClick={() => navigate(`/clothing/${item._id}`)}
                >
                  <div className="wl-dashboard-clothing-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                      />
                    ) : (
                      <span>WEARLOOP</span>
                    )}

                    <span
                      className={`wl-dashboard-status ${
                        item.status?.toLowerCase() === "available"
                          ? "is-available"
                          : "is-other"
                      }`}
                    >
                      {item.status || "Unknown"}
                    </span>
                  </div>

                  <div className="wl-dashboard-clothing-info">
                    <div>
                      <strong>{item.title}</strong>
                      <small>
                        {item.category || "Clothing"} · Size{" "}
                        {item.size || "N/A"}
                      </small>
                    </div>

                    <span className="wl-clothing-arrow">↗</span>
                  </div>

                  <div className="wl-dashboard-clothing-meta">
                    <span>
                      {item.condition || "Condition not specified"}
                    </span>
                    <strong>₹{item.value ?? 0}</strong>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RECENT SWAPS */}

        <section className="wl-dashboard-content-section wl-dashboard-swaps-section">
          <div className="wl-dashboard-section-heading">
            <div>
              <span className="wl-eyebrow">
                YOUR EXCHANGE HISTORY
              </span>
              <h2>Recent swap activity.</h2>
            </div>

            <button
              className="wl-dashboard-view-all"
              onClick={() => navigate("/swaps")}
            >
              View all swaps ↗
            </button>
          </div>

          {recentSwaps.length === 0 ? (
            <div className="wl-dashboard-empty wl-dashboard-empty-small">
              <span>↻</span>
              <h3>No swaps just yet.</h3>
              <p>
                Your exchange activity will appear here when you start swapping.
              </p>
              <button
                className="wl-button wl-button-dark"
                onClick={() => navigate("/")}
              >
                Explore clothing
              </button>
            </div>
          ) : (
            <div className="wl-dashboard-swap-list">
              {recentSwaps.map((swap) => (
                <div
                  className="wl-dashboard-swap-row"
                  key={swap._id}
                >
                  <div className="wl-swap-symbol">↻</div>

                  <div className="wl-swap-details">
                    <strong>
                      {swap.requestedClothing?.title ||
                        "Swap request"}
                    </strong>

                    <p>
                      Offering:{" "}
                      {swap.offeredClothing?.title || "Unknown"}
                    </p>

                    <small>
                      Requested:{" "}
                      {swap.requestedClothing?.title || "Unknown"}
                    </small>
                  </div>

                  <span
                    className={`wl-dashboard-swap-status wl-status-${(
                      swap.status || "unknown"
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {swap.status || "Unknown"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* BOTTOM BANNER */}

        <section className="wl-dashboard-banner">
          <div>
            <span className="wl-eyebrow">
              FASHION GOES FURTHER WHEN WE SHARE
            </span>
            <h2>
              Give your clothes
              <br />
              another story.
            </h2>
          </div>

          <button
            className="wl-button wl-button-light"
            onClick={() => navigate("/add-clothing")}
          >
            Share your clothing ↗
          </button>
        </section>

        {/* FOOTER */}

        <footer className="wl-dashboard-footer">
          <strong>WEARLOOP</strong>
          <span>Wear it. Swap it. Love it again.</span>
        </footer>
      </div>
    </main>
  );
}

export default Dashboard;
