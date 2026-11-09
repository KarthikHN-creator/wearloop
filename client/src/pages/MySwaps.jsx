
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function MySwaps() {
  const navigate = useNavigate();

  const [swaps, setSwaps] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [submittingReviewId, setSubmittingReviewId] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");

  const [reviewDrafts, setReviewDrafts] = useState({});

  const storedUser = localStorage.getItem("user");

  let currentUser = null;

  try {
    currentUser = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    currentUser = null;
  }

  const currentUserId = String(
    currentUser?._id || currentUser?.id || ""
  );

  useEffect(() => {
    fetchSwaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSwaps = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await API.get("/swaps", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (Array.isArray(response.data)) {
        setSwaps(response.data);
      } else {
        setSwaps([]);
        setMessage("Invalid swap data received from server.");
      }
    } catch (error) {
      console.error("Failed to fetch swaps:", error);

      setMessage(
        error.response?.data?.message || "Failed to load swaps."
      );
      setSwaps([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (swapId, status) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setUpdatingId(swapId);
      setMessage("");

      const response = await API.patch(
        `/swaps/${swapId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message || "Swap updated successfully.");
      await fetchSwaps();
    } catch (error) {
      console.error("Failed to update swap:", error);

      setMessage(
        error.response?.data?.message || "Failed to update swap."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const getParticipantId = (participant) =>
    String(participant?._id || participant?.id || participant || "");

  const getRole = (swap) => {
    const requesterId = getParticipantId(swap.requester);
    const ownerId = getParticipantId(swap.owner);

    if (requesterId === currentUserId) return "Outgoing";
    if (ownerId === currentUserId) return "Incoming";

    return "Participant";
  };

  const getOtherParticipant = (swap) => {
    const requesterId = getParticipantId(swap.requester);

    return requesterId === currentUserId
      ? swap.owner
      : swap.requester;
  };

  const hasReviewed = (swap) => {
    return (swap.reviews || []).some(
      (review) =>
        getParticipantId(review.reviewer) === currentUserId
    );
  };

  const getStatusClass = (status) =>
    String(status || "Pending").toLowerCase().replace(/\s+/g, "-");

  const handleReviewChange = (swapId, field, value) => {
    setReviewDrafts((previous) => ({
      ...previous,
      [swapId]: {
        rating: previous[swapId]?.rating || 0,
        comment: previous[swapId]?.comment || "",
        [field]: value,
      },
    }));
  };

  const submitReview = async (swapId) => {
    const draft = reviewDrafts[swapId] || {};
    const rating = draft.rating || 0;
    const comment = draft.comment || "";

    if (!rating || rating < 1 || rating > 5) {
      setMessage("Please select a rating between 1 and 5 stars.");
      return;
    }

    if (comment.length > 500) {
      setMessage("Review cannot exceed 500 characters.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      setSubmittingReviewId(swapId);
      setMessage("");

      const response = await API.post(
        `/swaps/${swapId}/reviews`,
        {
          rating,
          comment: comment.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        response.data.message || "Review submitted successfully!"
      );

      setReviewDrafts((previous) => {
        const updated = { ...previous };
        delete updated[swapId];
        return updated;
      });

      await fetchSwaps();
    } catch (error) {
      console.error("Failed to submit review:", error);

      setMessage(
        error.response?.data?.message || "Failed to submit review."
      );
    } finally {
      setSubmittingReviewId("");
    }
  };

  const filteredSwaps = swaps.filter((swap) => {
    const role = getRole(swap);
    const status = swap.status || "Pending";

    const matchesTab =
      activeTab === "All" || role === activeTab;

    const matchesStatus =
      activeStatus === "All" || status === activeStatus;

    return matchesTab && matchesStatus;
  });

  const counts = {
    All: swaps.length,
    Incoming: swaps.filter((swap) => getRole(swap) === "Incoming").length,
    Outgoing: swaps.filter((swap) => getRole(swap) === "Outgoing").length,
  };

  const statusCounts = {
    All: swaps.length,
    Pending: swaps.filter((swap) => (swap.status || "Pending") === "Pending").length,
    Accepted: swaps.filter((swap) => swap.status === "Accepted").length,
    Completed: swaps.filter((swap) => swap.status === "Completed").length,
    Rejected: swaps.filter((swap) => swap.status === "Rejected").length,
    Cancelled: swaps.filter((swap) => swap.status === "Cancelled").length,
  };

  if (loading) {
    return (
      <main className="wl-swaps-page">
        <div className="wl-swaps-container">
          <div className="wl-swaps-heading">
            <span className="wl-swaps-eyebrow">YOUR ACTIVITY</span>
            <h1>My swaps<span>.</span></h1>
            <p>Loading your swap activity...</p>
          </div>
          <div className="wl-swaps-loading">
            <div className="wl-skeleton" />
            <div className="wl-skeleton" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wl-swaps-page">
      <div className="wl-swaps-container">

        <section className="wl-swaps-hero">
          <div>
            <span className="wl-swaps-eyebrow">YOUR WEARLOOP ACTIVITY</span>
            <h1>My swaps<span>.</span></h1>
            <p>
              Keep track of what you're giving, what you're getting,
              and every swap in between.
            </p>
          </div>

          <button
            className="wl-swaps-browse"
            onClick={() => navigate("/marketplace")}
          >
            Explore marketplace <span>↗</span>
          </button>
        </section>

        <section className="wl-swaps-stats">
          <div className="wl-swaps-stat">
            <span>Total swaps</span>
            <strong>{counts.All}</strong>
          </div>
          <div className="wl-swaps-stat">
            <span>Incoming</span>
            <strong>{counts.Incoming}</strong>
          </div>
          <div className="wl-swaps-stat">
            <span>Outgoing</span>
            <strong>{counts.Outgoing}</strong>
          </div>
          <div className="wl-swaps-stat">
            <span>Completed</span>
            <strong>{statusCounts.Completed}</strong>
          </div>
        </section>

        {message && (
          <div className="wl-swaps-message" role="status">
            {message}
          </div>
        )}

        <section className="wl-swaps-content">
          <div className="wl-swaps-toolbar">
            <div>
              <h2>Swap activity</h2>
              <p>Manage and follow your clothing exchanges.</p>
            </div>

            <button
              className="wl-swaps-refresh"
              onClick={fetchSwaps}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="wl-swaps-tabs">
            {["All", "Incoming", "Outgoing"].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                <span>{counts[tab]}</span>
              </button>
            ))}
          </div>

          <div className="wl-swaps-status-filters">
            {["All", "Pending", "Accepted", "Completed", "Rejected", "Cancelled"].map(
              (status) => (
                <button
                  key={status}
                  className={activeStatus === status ? "active" : ""}
                  onClick={() => setActiveStatus(status)}
                >
                  {status}
                  <span>{statusCounts[status]}</span>
                </button>
              )
            )}
          </div>

          {filteredSwaps.length === 0 ? (
            <div className="wl-swaps-empty">
              <div className="wl-swaps-empty-icon">↔</div>
              <h3>
                {swaps.length === 0
                  ? "Your swap journey starts here"
                  : "No swaps found"}
              </h3>
              <p>
                {swaps.length === 0
                  ? "Discover something you love and exchange clothes with the community."
                  : "Try selecting a different tab or status filter."}
              </p>
              {swaps.length === 0 && (
                <button
                  className="wl-swaps-browse"
                  onClick={() => navigate("/marketplace")}
                >
                  Browse clothing <span>↗</span>
                </button>
              )}
              {swaps.length > 0 && (
                <button
                  className="wl-swaps-clear"
                  onClick={() => {
                    setActiveTab("All");
                    setActiveStatus("All");
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="wl-swaps-list">
              {filteredSwaps.map((swap) => {
                const role = getRole(swap);
                const status = swap.status || "Pending";
                const isOwner = role === "Incoming";
                const isRequester = role === "Outgoing";
                const isUpdating = updatingId === swap._id;
                const reviewed = hasReviewed(swap);
                const otherParticipant = getOtherParticipant(swap);
                const draft = reviewDrafts[swap._id] || {
                  rating: 0,
                  comment: "",
                };

                const canChat = ![
                  "Rejected",
                  "Cancelled",
                  "Completed",
                ].includes(status);

                return (
                  <article className="wl-swap-card" key={swap._id}>
                    <div className="wl-swap-card-top">
                      <div className="wl-swap-role">
                        <span className="wl-swap-role-icon">
                          {isOwner ? "↓" : isRequester ? "↑" : "↔"}
                        </span>
                        <span>{role} request</span>
                      </div>

                      <span
                        className={`wl-swap-status wl-status-${getStatusClass(status)}`}
                      >
                        <i />
                        {status}
                      </span>
                    </div>

                    <div className="wl-swap-exchange">
                      <div className="wl-swap-item">
                        <span className="wl-swap-item-label">YOU OFFER</span>
                        <div className="wl-swap-item-visual">
                          {swap.offeredClothing?.image ? (
                            <img
                              src={swap.offeredClothing.image}
                              alt={swap.offeredClothing.title || "Offered clothing"}
                            />
                          ) : (
                            <span>✳</span>
                          )}
                        </div>
                        <h3>
                          {swap.offeredClothing?.title || "Unknown clothing"}
                        </h3>
                      </div>

                      <div className="wl-swap-arrow">⇄</div>

                      <div className="wl-swap-item">
                        <span className="wl-swap-item-label">YOU RECEIVE</span>
                        <div className="wl-swap-item-visual">
                          {swap.requestedClothing?.image ? (
                            <img
                              src={swap.requestedClothing.image}
                              alt={swap.requestedClothing.title || "Requested clothing"}
                            />
                          ) : (
                            <span>✳</span>
                          )}
                        </div>
                        <h3>
                          {swap.requestedClothing?.title || "Unknown clothing"}
                        </h3>
                      </div>
                    </div>

                    <div className="wl-swap-details">
                      <div>
                        <span>REQUESTER</span>
                        <strong>{swap.requester?.name || "Unknown"}</strong>
                      </div>
                      <div>
                        <span>OWNER</span>
                        <strong>{swap.owner?.name || "Unknown"}</strong>
                      </div>
                      <div>
                        <span>YOUR ROLE</span>
                        <strong>{role}</strong>
                      </div>
                    </div>

                    {swap.message && (
                      <div className="wl-swap-note">
                        <span>MESSAGE</span>
                        <p>“{swap.message}”</p>
                      </div>
                    )}

                    <div className="wl-swap-footer">
                      <div className="wl-swap-result">
                        {status === "Pending" && "Waiting for a response"}
                        {status === "Accepted" && "This swap has been accepted"}
                        {status === "Completed" && "Swap completed successfully"}
                        {status === "Rejected" && "This request was rejected"}
                        {status === "Cancelled" && "This request was cancelled"}
                      </div>

                      <div className="wl-swap-actions">
                        {canChat && (
                          <button
                            className="wl-swap-chat"
                            onClick={() => navigate(`/chat/${swap._id}`)}
                          >
                            Chat ↗
                          </button>
                        )}

                        {isOwner && status === "Pending" && (
                          <>
                            <button
                              className="wl-swap-reject"
                              disabled={isUpdating}
                              onClick={() => updateStatus(swap._id, "Rejected")}
                            >
                              Reject
                            </button>
                            <button
                              className="wl-swap-accept"
                              disabled={isUpdating}
                              onClick={() => updateStatus(swap._id, "Accepted")}
                            >
                              {isUpdating ? "Updating..." : "Accept request"}
                            </button>
                          </>
                        )}

                        {isRequester && status === "Pending" && (
                          <button
                            className="wl-swap-reject"
                            disabled={isUpdating}
                            onClick={() => updateStatus(swap._id, "Cancelled")}
                          >
                            {isUpdating ? "Updating..." : "Cancel request"}
                          </button>
                        )}

                        {status === "Accepted" && (
                          <button
                            className="wl-swap-accept"
                            disabled={isUpdating}
                            onClick={() => updateStatus(swap._id, "Completed")}
                          >
                            {isUpdating ? "Updating..." : "Mark completed"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* REVIEW SECTION */}
                    {status === "Completed" && (
                      <section className="wl-swap-review">
                        <div className="wl-swap-review-heading">
                          <span className="wl-swap-review-icon">✳</span>
                          <div>
                            <h3>Swap feedback</h3>
                            <p>
                              Share your experience with{" "}
                              <strong>
                                {otherParticipant?.name || "the other member"}
                              </strong>
                            </p>
                          </div>
                        </div>

                        {reviewed ? (
                          <div className="wl-swap-review-success">
                            <span>✓</span>
                            You have submitted your review for this swap.
                          </div>
                        ) : (
                          <div className="wl-swap-review-form">
                            <label>How was your swap experience?</label>

                            <div
                              className="wl-swap-review-stars"
                              role="group"
                              aria-label="Choose a rating from 1 to 5 stars"
                            >
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  className={
                                    star <= draft.rating ? "selected" : ""
                                  }
                                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                                  aria-pressed={draft.rating === star}
                                  onClick={() =>
                                    handleReviewChange(
                                      swap._id,
                                      "rating",
                                      star
                                    )
                                  }
                                >
                                  ★
                                </button>
                              ))}
                              <span>
                                {draft.rating
                                  ? `${draft.rating} / 5`
                                  : "Select rating"}
                              </span>
                            </div>

                            <label htmlFor={`review-${swap._id}`}>
                              Write a review (optional)
                            </label>

                            <textarea
                              id={`review-${swap._id}`}
                              value={draft.comment}
                              maxLength={500}
                              placeholder="How was the communication, clothing condition and overall experience?"
                              onChange={(event) =>
                                handleReviewChange(
                                  swap._id,
                                  "comment",
                                  event.target.value
                                )
                              }
                            />

                            <div className="wl-swap-review-bottom">
                              <span>
                                {draft.comment.length}/500 characters
                              </span>

                              <button
                                type="button"
                                className="wl-swap-review-submit"
                                disabled={
                                  submittingReviewId === swap._id
                                }
                                onClick={() => submitReview(swap._id)}
                              >
                                {submittingReviewId === swap._id
                                  ? "Submitting..."
                                  : "Submit review"}
                              </button>
                            </div>
                          </div>
                        )}
                      </section>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="wl-swaps-bottom-note">
          <span>✳</span>
          Good swaps make better wardrobes. Thanks for keeping fashion circular.
        </div>
      </div>
    </main>
  );
}

export default MySwaps;
