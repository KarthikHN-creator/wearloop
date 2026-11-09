
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import SwapValueCalculator from "../components/SwapValueCalculator";

function ClothingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [myClothes, setMyClothes] = useState([]);
  const [selectedClothing, setSelectedClothing] = useState("");
  const [swapMessage, setSwapMessage] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSwapForm, setShowSwapForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    currentUser = null;
  }

  const currentUserId = currentUser?._id || currentUser?.id;

  const itemOwnerId =
    typeof item?.owner === "object"
      ? item.owner?._id || item.owner?.id
      : item?.owner;

  const isMyClothing =
    currentUserId &&
    itemOwnerId &&
    String(currentUserId) === String(itemOwnerId);

  const isAvailable =
    item?.status?.toLowerCase() === "available";

  // FETCH CLOTHING DETAILS
  useEffect(() => {
    const fetchClothing = async () => {
      try {
        setLoading(true);
        setMessage("");
        setItem(null);

        const response = await API.get(`/clothes/${id}`);
        setItem(response.data);
      } catch (error) {
        console.error("Failed to fetch clothing:", error);
        setMessage(
          error.response?.data?.message ||
            "Failed to load clothing details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClothing();
  }, [id]);

  // OPEN SELLER PUBLIC PROFILE
  const openOwnerProfile = () => {
    if (itemOwnerId) {
      navigate(`/members/${itemOwnerId}`);
    }
  };

  // HANDLE SWAP BUTTON
  const handleSwapClick = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    if (isMyClothing) {
      setMessage("You cannot request a swap for your own clothing.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await API.get("/clothes");

      const allClothes = Array.isArray(response.data)
        ? response.data
        : [];

      const availableClothes = allClothes.filter((clothing) => {
        const ownerId =
          typeof clothing.owner === "object"
            ? clothing.owner?._id || clothing.owner?.id
            : clothing.owner;

        return (
          String(ownerId) === String(currentUserId) &&
          String(clothing._id) !== String(item._id) &&
          clothing.status?.toLowerCase() === "available"
        );
      });

      setMyClothes(availableClothes);
      setShowSwapForm(true);
    } catch (error) {
      console.error("Failed to load your clothing:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to load your clothing."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // SUBMIT SWAP REQUEST
  const handleSubmitSwap = async (event) => {
    event.preventDefault();

    if (!selectedClothing) {
      setMessage("Please select clothing to offer.");
      return;
    }

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await API.post("/swaps", {
        owner: itemOwnerId,
        offeredClothing: selectedClothing,
        requestedClothing: item._id,
        message: swapMessage,
      });

      setMessage(
        response.data.message || "Swap request sent successfully!"
      );

      setSelectedClothing("");
      setSwapMessage("");
      setShowSwapForm(false);
    } catch (error) {
      console.error("Swap request error:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to create swap request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // CANCEL SWAP FORM
  const handleCancel = () => {
    setShowSwapForm(false);
    setSelectedClothing("");
    setSwapMessage("");
    setMessage("");
  };

  // LOADING STATE
  if (loading) {
    return (
      <main className="wl-details-page">
        <div className="wl-details-state">
          <div className="wl-loader" />
          <h2>Preparing your find...</h2>
          <p>Loading clothing details.</p>
        </div>
      </main>
    );
  }

  // NOT FOUND STATE
  if (!item) {
    return (
      <main className="wl-details-page">
        <div className="wl-details-state">
          <span className="wl-details-state-icon">⌕</span>
          <h2>We couldn't find this piece.</h2>
          <p>
            {message ||
              "This clothing item may no longer be available."}
          </p>

          <button
            className="wl-button wl-button-dark"
            onClick={() => navigate("/")}
          >
            Back to marketplace
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="wl-details-page">
      <div className="wl-details-container">

        <button
          className="wl-details-back"
          onClick={() => navigate(-1)}
        >
          ← Back to collection
        </button>

        <div className="wl-details-breadcrumb">
          WEARLOOP <span>/</span> COLLECTION <span>/</span>{" "}
          {item.category || "CLOTHING"}
        </div>

        <section className="wl-product-layout">

          {/* PRODUCT IMAGE */}
          <div className="wl-product-visual">
            <div className="wl-product-image">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title || "Clothing item"}
                />
              ) : (
                <div className="wl-product-no-image">
                  <span>WEARLOOP</span>
                  <p>No image available</p>
                </div>
              )}

              <span
                className={`wl-product-status ${
                  isAvailable ? "available" : "unavailable"
                }`}
              >
                {item.status || "Unknown"}
              </span>
            </div>

            <div className="wl-image-caption">
              <span>PRE-LOVED</span>
              <span>RE-LOVED</span>
            </div>
          </div>

          {/* PRODUCT INFORMATION */}
          <div className="wl-product-information">
            <span className="wl-eyebrow">
              {item.category || "PRE-LOVED FASHION"}
            </span>

            <h1>{item.title}</h1>

            {item.brand && (
              <p className="wl-product-brand">{item.brand}</p>
            )}

            <div className="wl-product-value">
              <span>ESTIMATED CLOTHING VALUE</span>
              <strong>
                ₹{Number(item.value ?? 0).toLocaleString("en-IN")}
              </strong>
            </div>

            <p className="wl-product-intro">
              A piece with more life to live. Discover its details and
              connect with the member sharing it.
            </p>

            {/* SPECIFICATIONS */}
            <div className="wl-product-specifications">
              <div>
                <span>Size</span>
                <strong>{item.size || "Not specified"}</strong>
              </div>

              <div>
                <span>Condition</span>
                <strong>{item.condition || "Not specified"}</strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{item.category || "Not specified"}</strong>
              </div>

              <div>
                <span>Availability</span>
                <strong>{item.status || "Unknown"}</strong>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="wl-product-description">
              <h3>About this piece</h3>
              <p>
                {item.description ||
                  "The owner has not added a description for this piece yet."}
              </p>
            </div>

            {/* CLICKABLE SELLER PROFILE */}
            <button
              type="button"
              className="wl-product-owner wl-product-owner-clickable"
              onClick={openOwnerProfile}
              disabled={!itemOwnerId}
              title="View member profile"
            >
              <div className="wl-product-owner-avatar">
                {item.owner?.profileImage ? (
                  <img
                    src={item.owner.profileImage}
                    alt={item.owner?.name || "Member"}
                  />
                ) : (
                  <span>
                    {(item.owner?.name || "W")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="wl-owner-information">
                <span>SHARED BY</span>

                <strong>
                  {item.owner?.name || "WearLoop member"}
                </strong>

                <small>
                  {item.owner?.location ||
                    item.location ||
                    "Location not specified"}
                </small>
              </div>

              <span className="wl-product-owner-arrow">↗</span>
            </button>

            {/* ITEM LOCATION */}
            <div className="wl-product-location">
              <span>⌖</span>
              <div>
                <small>ITEM LOCATION</small>
                <strong>
                  {item.location || "Not specified"}
                </strong>
              </div>
            </div>

            {/* SWAP ACTIONS */}
            {isAvailable && !isMyClothing && (
              <button
                className="wl-details-swap-button"
                onClick={handleSwapClick}
                disabled={submitting}
              >
                {submitting
                  ? "Loading your wardrobe..."
                  : "Request a swap ↗"}
              </button>
            )}

            {isAvailable && isMyClothing && (
              <div className="wl-details-notice">
                ✓ This is your clothing listing.
              </div>
            )}

            {!isAvailable && (
              <div className="wl-details-notice">
                This piece is currently unavailable for swapping.
              </div>
            )}

            {message && (
              <div className="wl-details-message" role="status">
                {message}
              </div>
            )}
          </div>
        </section>

        {/* SWAP REQUEST FORM */}
        {showSwapForm && (
          <section className="wl-swap-panel">
            <div className="wl-swap-panel-heading">
              <div>
                <span className="wl-eyebrow">
                  MAKE AN EXCHANGE
                </span>

                <h2>What would you like to offer?</h2>

                <p>
                  Choose an available item from your wardrobe to propose
                  an exchange.
                </p>
              </div>

              <button
                type="button"
                className="wl-swap-close"
                onClick={handleCancel}
                aria-label="Close swap form"
              >
                ×
              </button>
            </div>

            {myClothes.length > 0 ? (
              <form onSubmit={handleSubmitSwap}>
                <label className="wl-swap-field">
                  <span>Select your clothing</span>

                  <select
                    value={selectedClothing}
                    onChange={(event) =>
                      setSelectedClothing(event.target.value)
                    }
                    required
                  >
                    <option value="">
                      Choose an item from your wardrobe
                    </option>

                    {myClothes.map((clothing) => (
                      <option
                        key={clothing._id}
                        value={clothing._id}
                      >
                        {clothing.title} —{" "}
                        {clothing.category || "Clothing"} — Size{" "}
                        {clothing.size || "N/A"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="wl-swap-field">
                  <span>Message to the owner (optional)</span>

                  <textarea
                    value={swapMessage}
                    onChange={(event) =>
                      setSwapMessage(event.target.value)
                    }
                    placeholder="Tell the owner why you'd like to exchange..."
                    rows={4}
                  />
                </label>

                <div className="wl-swap-form-actions">
                  <button
                    type="submit"
                    className="wl-button wl-button-dark"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Sending request..."
                      : "Send swap request"}
                  </button>

                  <button
                    type="button"
                    className="wl-swap-cancel"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="wl-no-wardrobe-items">
                <p>
                  You don't have any available clothing to offer yet.
                </p>

                <button
                  className="wl-button wl-button-dark"
                  onClick={() => navigate("/add-clothing")}
                >
                  Add clothing to your wardrobe
                </button>
              </div>
            )}
          </section>
        )}

        {/* SWAP VALUE CALCULATOR */}
        <section className="wl-calculator-area">
          <div className="wl-calculator-heading">
            <span className="wl-eyebrow">
              FAIRER EXCHANGES
            </span>

            <h2>Check your swap value.</h2>

            <p>
              Compare clothing values before making an exchange.
            </p>
          </div>

          <SwapValueCalculator
            currentClothing={item}
            clothes={myClothes}
          />
        </section>

        {/* FOOTER */}
        <section className="wl-details-footer">
          <span>WEARLOOP</span>
          <p>Wear it. Swap it. Love it again.</p>
        </section>

      </div>
    </main>
  );
}

export default ClothingDetails;
