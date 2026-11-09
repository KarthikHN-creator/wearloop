
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function ClothingCard({ item }) {
  const navigate = useNavigate();

  const [showSwapForm, setShowSwapForm] = useState(false);
  const [myClothes, setMyClothes] = useState([]);
  const [selectedClothing, setSelectedClothing] = useState("");
  const [swapMessage, setSwapMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [feedback, setFeedback] = useState(null);

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const currentUserId = user._id || user.id;

  const ownerId =
    typeof item.owner === "object"
      ? item.owner?._id || item.owner?.id
      : item.owner;

  const isOwner =
    currentUserId &&
    ownerId &&
    String(currentUserId) === String(ownerId);

  const isAvailable =
    item.status?.toLowerCase() === "available";

  const offeredItem = myClothes.find(
    (clothing) => clothing._id === selectedClothing
  );

  const requestedValue = Number(item.value);
  const offeredValue = Number(offeredItem?.value);

  const hasValidValues =
    offeredItem &&
    item.value !== null &&
    item.value !== undefined &&
    offeredItem.value !== null &&
    offeredItem.value !== undefined &&
    Number.isFinite(requestedValue) &&
    Number.isFinite(offeredValue) &&
    requestedValue > 0 &&
    offeredValue > 0;

  const valueDifference = hasValidValues
    ? offeredValue - requestedValue
    : null;

  const differencePercentage = hasValidValues
    ? (Math.abs(valueDifference) / requestedValue) * 100
    : null;

  const formatValue = (value) =>
    `₹${Number(value).toLocaleString("en-IN")}`;

  const getValueMessage = () => {
    if (!hasValidValues) {
      return "Add valid clothing values to compare this offer.";
    }

    if (differencePercentage <= 10) {
      return "Your offer is approximately balanced.";
    }

    if (differencePercentage <= 20) {
      return valueDifference > 0
        ? "Your offered item has a slightly higher value."
        : "The requested item has a slightly higher value.";
    }

    return valueDifference > 0
      ? "Your offered item has considerably higher value."
      : "The requested item has considerably higher value.";
  };

  // OPEN SWAP FORM
  const openSwapForm = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    if (requestSent) return;

    try {
      setLoading(true);
      setFeedback(null);

      const response = await API.get("/clothes");

      const allClothes = Array.isArray(response.data)
        ? response.data
        : [];

      const availableItems = allClothes.filter((clothing) => {
        const clothingOwnerId =
          typeof clothing.owner === "object"
            ? clothing.owner?._id || clothing.owner?.id
            : clothing.owner;

        return (
          String(clothingOwnerId) === String(currentUserId) &&
          String(clothing._id) !== String(item._id) &&
          clothing.status?.toLowerCase() === "available"
        );
      });

      setMyClothes(availableItems);
      setShowSwapForm(true);
    } catch (error) {
      console.error("Could not load your clothing:", error);

      setFeedback({
        type: "error",
        message: "Unable to load your clothing. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // SUBMIT SWAP REQUEST
  const handleSubmitSwap = async (event) => {
    event.preventDefault();

    if (!selectedClothing) {
      setFeedback({
        type: "error",
        message: "Please select an item to offer.",
      });
      return;
    }

    if (requestSent || submitting) return;

    try {
      setSubmitting(true);
      setFeedback(null);

      await API.post("/swaps", {
        owner: ownerId,
        offeredClothing: selectedClothing,
        requestedClothing: item._id,
        message: swapMessage,
      });

      setRequestSent(true);
      setShowSwapForm(false);
      setSelectedClothing("");
      setSwapMessage("");

      setFeedback({
        type: "success",
        message: "Your swap request has been sent successfully!",
      });
    } catch (error) {
      console.error("Swap request failed:", error);

      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Could not send swap request. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // OPEN SELLER PUBLIC PROFILE
  const openOwnerProfile = () => {
    if (ownerId) {
      navigate(`/members/${ownerId}`);
    }
  };

  return (
    <article className="wl-item-card">
      {/* CLOTHING IMAGE */}
      <button
        type="button"
        className="wl-item-image"
        onClick={() => navigate(`/clothing/${item._id}`)}
        aria-label={`View ${item.title}`}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.title || "Clothing item"}
          />
        ) : (
          <div className="wl-image-placeholder">WEARLOOP</div>
        )}

        <span
          className={`wl-item-status ${
            isAvailable
              ? "wl-status-available"
              : "wl-status-other"
          }`}
        >
          {item.status || "Unknown"}
        </span>
      </button>

      <div className="wl-item-content">
        {/* CATEGORY AND SIZE */}
        <div className="wl-item-category-row">
          <span>{item.category || "Clothing"}</span>
          <span>
            {item.size ? `SIZE ${item.size}` : "SIZE —"}
          </span>
        </div>

        {/* CLOTHING TITLE */}
        <button
          type="button"
          className="wl-item-title"
          onClick={() => navigate(`/clothing/${item._id}`)}
        >
          {item.title || "Untitled clothing"}
        </button>

        <p className="wl-item-brand">
          {item.brand || "Pre-loved fashion"}
        </p>

        {/* CONDITION AND VALUE */}
        <div className="wl-item-details">
          <span>
            {item.condition || "Condition not specified"}
          </span>

          {item.value !== undefined && item.value !== null && (
            <strong>{formatValue(item.value)}</strong>
          )}
        </div>

        {/* LOCATION */}
        <div className="wl-item-location">
          <span aria-hidden="true">⌖</span>
          {item.location || "Location not specified"}
        </div>

        {/* CLICKABLE OWNER PROFILE */}
        <button
          type="button"
          className="wl-item-owner wl-owner-profile-link"
          onClick={openOwnerProfile}
          disabled={!ownerId}
          title="View member profile"
        >
          {item.owner?.profileImage ? (
            <img
              src={item.owner.profileImage}
              alt=""
              className="wl-owner-avatar"
            />
          ) : (
            <span className="wl-owner-avatar wl-owner-avatar-placeholder">
              {(item.owner?.name || "W").charAt(0).toUpperCase()}
            </span>
          )}

          <span>
            Shared by{" "}
            <strong>
              {item.owner?.name || "WearLoop member"}
            </strong>
          </span>

          <span className="wl-owner-arrow">↗</span>
        </button>

        {/* ACTION BUTTONS */}
        <div className="wl-item-actions">
          <button
            type="button"
            className="wl-card-details-button"
            onClick={() => navigate(`/clothing/${item._id}`)}
          >
            View details
          </button>

          {isOwner ? (
            <span className="wl-own-item-label">
              Your listing
            </span>
          ) : requestSent ? (
            <span className="wl-own-item-label">
              Request sent ✓
            </span>
          ) : isAvailable ? (
            <button
              type="button"
              className="wl-card-swap-button"
              onClick={openSwapForm}
              disabled={loading}
            >
              {loading ? "Loading..." : "Request swap ↗"}
            </button>
          ) : (
            <span className="wl-own-item-label">
              Not available
            </span>
          )}
        </div>

        {/* FEEDBACK */}
        {feedback && (
          <div
            className={`wl-card-feedback wl-card-feedback-${feedback.type}`}
            role="status"
          >
            <span>
              {feedback.type === "success" ? "✓" : "!"}
            </span>
            {feedback.message}
          </div>
        )}

        {/* SWAP REQUEST FORM */}
        {showSwapForm && (
          <form
            className="wl-swap-form wl-card-swap-panel"
            onSubmit={handleSubmitSwap}
          >
            <div className="wl-swap-form-heading">
              <div>
                <strong>Make a swap offer</strong>
                <p>Choose an item from your wardrobe.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowSwapForm(false)}
                aria-label="Close swap form"
              >
                ×
              </button>
            </div>

            {myClothes.length === 0 ? (
              <div className="wl-no-clothes">
                <p>
                  You don't have any available clothing to offer yet.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/add-clothing")}
                >
                  + List an item
                </button>
              </div>
            ) : (
              <>
                <label className="wl-card-swap-label">
                  Choose your clothing

                  <select
                    value={selectedClothing}
                    onChange={(event) =>
                      setSelectedClothing(event.target.value)
                    }
                    required
                  >
                    <option value="">Select an item</option>

                    {myClothes.map((clothing) => (
                      <option
                        key={clothing._id}
                        value={clothing._id}
                      >
                        {clothing.title} — {clothing.size || "No size"}
                      </option>
                    ))}
                  </select>
                </label>

                {/* VALUE COMPARISON */}
                {offeredItem && (
                  <div className="wl-card-value-comparison">
                    <div className="wl-card-comparison-heading">
                      <strong>Swap value comparison</strong>
                      <span>Estimated values</span>
                    </div>

                    <div className="wl-card-comparison-items">
                      <div>
                        <span>You offer</span>
                        <strong>
                          {offeredItem.value != null
                            ? formatValue(offeredItem.value)
                            : "Not set"}
                        </strong>
                        <small>{offeredItem.title}</small>
                      </div>

                      <div className="wl-card-comparison-divider">
                        ↔
                      </div>

                      <div>
                        <span>You request</span>
                        <strong>
                          {item.value != null
                            ? formatValue(item.value)
                            : "Not set"}
                        </strong>
                        <small>{item.title}</small>
                      </div>
                    </div>

                    <p
                      className={`wl-card-value-message ${
                        hasValidValues &&
                        differencePercentage <= 10
                          ? "wl-value-balanced"
                          : ""
                      }`}
                    >
                      {getValueMessage()}
                    </p>
                  </div>
                )}

                {/* MESSAGE */}
                <label className="wl-card-swap-label">
                  Message <span>(optional)</span>

                  <textarea
                    value={swapMessage}
                    onChange={(event) =>
                      setSwapMessage(event.target.value)
                    }
                    placeholder="Write a short message with your offer..."
                    rows="3"
                    maxLength={300}
                  />
                </label>

                <div className="wl-card-message-count">
                  {swapMessage.length}/300
                </div>

                <button
                  type="submit"
                  className="wl-card-swap-button wl-submit-swap"
                  disabled={submitting || requestSent}
                >
                  {submitting
                    ? "Sending offer..."
                    : "Send swap request ↗"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </article>
  );
}

export default ClothingCard;
