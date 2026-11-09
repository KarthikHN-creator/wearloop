
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function SwapValueCalculator() {
  const navigate = useNavigate();

  const [clothes, setClothes] = useState([]);
  const [requestedId, setRequestedId] = useState("");
  const [offeredId, setOfferedId] = useState("");
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const currentUserId = user._id || user.id;

  // Fetch clothing listings
  useEffect(() => {
    const fetchClothes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/clothes");

        const data = response.data;

        const listings = Array.isArray(data)
          ? data
          : Array.isArray(data?.clothes)
          ? data.clothes
          : [];

        setClothes(listings);
      } catch (err) {
        console.error("Failed to load clothing:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load clothing listings. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClothes();
  }, []);

  // Get clothing owner ID
  const getOwnerId = (clothing) => {
    const owner = clothing?.owner;

    if (typeof owner === "object" && owner !== null) {
      return owner._id || owner.id;
    }

    return owner;
  };

  // Available clothing
  const availableClothes = useMemo(
    () =>
      clothes.filter(
        (clothing) =>
          clothing.status?.toLowerCase() === "available"
      ),
    [clothes]
  );

  // Clothing belonging to other users
  const requestedClothes = useMemo(
    () =>
      availableClothes.filter((clothing) => {
        const ownerId = getOwnerId(clothing);

        return (
          ownerId &&
          currentUserId &&
          String(ownerId) !== String(currentUserId)
        );
      }),
    [availableClothes, currentUserId]
  );

  // Clothing belonging to current user
  const offeredClothes = useMemo(
    () =>
      availableClothes.filter((clothing) => {
        const ownerId = getOwnerId(clothing);

        return (
          ownerId &&
          currentUserId &&
          String(ownerId) === String(currentUserId)
        );
      }),
    [availableClothes, currentUserId]
  );

  const requestedItem = requestedClothes.find(
    (clothing) => clothing._id === requestedId
  );

  const offeredItem = offeredClothes.find(
    (clothing) => clothing._id === offeredId
  );

  // Format currency
  const formatValue = (value) =>
    `₹${Number(value).toLocaleString("en-IN")}`;

  // Get clothing value
  const getValue = (clothing) => {
    const value = Number(clothing?.value);

    return Number.isFinite(value) && value > 0
      ? value
      : 0;
  };

  // Calculate swap comparison
  const calculateComparison = () => {
    setComparison(null);

    if (!requestedItem || !offeredItem) {
      setError("Please select both clothing items.");
      return;
    }

    const requestedValue = getValue(requestedItem);
    const offeredValue = getValue(offeredItem);

    if (!requestedValue || !offeredValue) {
      setComparison({
        error:
          "Both clothing items must have a valid value greater than ₹0."
      });
      return;
    }

    const difference = Math.abs(
      requestedValue - offeredValue
    );

    const percentage =
      (difference /
        Math.max(requestedValue, offeredValue)) *
      100;

    let result;
    let resultClass;

    if (percentage <= 10) {
      result = "Approximately balanced";
      resultClass = "balanced";
    } else if (percentage <= 20) {
      result = "Small value difference";
      resultClass = "small";
    } else {
      result = "Considerable value difference";
      resultClass = "large";
    }

    setComparison({
      requestedValue,
      offeredValue,
      difference,
      percentage,
      result,
      resultClass
    });

    setError("");
  };

  // Reset comparison
  const handleReset = () => {
    setRequestedId("");
    setOfferedId("");
    setComparison(null);
    setError("");
  };

  // Clothing image
  const renderClothingImage = (clothing) => {
    if (clothing?.image) {
      return (
        <img
          src={clothing.image}
          alt={clothing.title || "Clothing item"}
        />
      );
    }

    return (
      <div className="wl-page-calculator-placeholder">
        <span>W</span>
        <small>WEARLOOP</small>
      </div>
    );
  };

  // Calculate visual bar width
  const getBarWidth = (value, comparisonData) => {
    const maximum = Math.max(
      comparisonData.requestedValue,
      comparisonData.offeredValue
    );

    return `${(value / maximum) * 100}%`;
  };

  return (
    <main className="wl-page-calculator">

      {/* Hero section */}
      <section className="wl-page-calculator-hero">
        <span className="wl-page-calculator-eyebrow">
          THE SMARTER WAY TO SWAP
        </span>

        <h1>Every swap deserves a fair comparison.</h1>

        <p>
          Compare the listed values of two clothing pieces
          before making an exchange. Make informed choices
          and swap with confidence.
        </p>

        <div className="wl-page-calculator-hero-note">
          <span>✳</span>
          A smarter wardrobe starts with thoughtful swaps.
        </div>
      </section>

      {/* Main calculator */}
      <section className="wl-page-calculator-panel">

        <div className="wl-page-calculator-heading">
          <div>
            <span className="wl-page-calculator-eyebrow">
              SMART SWAP COMPARISON
            </span>

            <h2>Compare your clothing</h2>

            <p>
              Choose one item you want and one item you can offer.
            </p>
          </div>

          <div className="wl-page-calculator-icon">₹</div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="wl-page-calculator-state">
            <div className="wl-page-calculator-spinner" />
            <p>Loading clothing listings...</p>
          </div>
        ) : error && clothes.length === 0 ? (
          <div className="wl-page-calculator-state">
            <p>{error}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Clothing selection */}
            <div className="wl-page-calculator-grid">

              {/* Requested clothing */}
              <div className="wl-page-calculator-choice">

                <div className="wl-page-calculator-choice-title">
                  <span className="wl-page-calculator-number">
                    01
                  </span>

                  <div>
                    <span>WHAT YOU WANT</span>
                    <h3>Requested clothing</h3>
                  </div>
                </div>

                <div className="wl-page-calculator-preview">
                  {renderClothingImage(requestedItem)}

                  <div>
                    <strong>
                      {requestedItem?.title || "Choose an item"}
                    </strong>

                    <span>
                      {requestedItem
                        ? requestedItem.category || "Clothing"
                        : "Select from other members' listings"}
                    </span>

                    <b>
                      {requestedItem
                        ? formatValue(getValue(requestedItem))
                        : "—"}
                    </b>
                  </div>
                </div>

                <label className="wl-page-calculator-label">
                  Select requested item

                  <select
                    value={requestedId}
                    onChange={(event) => {
                      setRequestedId(event.target.value);
                      setComparison(null);
                      setError("");
                    }}
                  >
                    <option value="">Choose clothing</option>

                    {requestedClothes.map((clothing) => (
                      <option
                        key={clothing._id}
                        value={clothing._id}
                      >
                        {clothing.title} —{" "}
                        {formatValue(getValue(clothing))}
                      </option>
                    ))}
                  </select>
                </label>

                {requestedItem && (
                  <div className="wl-page-calculator-meta">
                    <span>
                      Size: {requestedItem.size || "Not specified"}
                    </span>

                    <span>
                      Condition:{" "}
                      {requestedItem.condition || "Not specified"}
                    </span>
                  </div>
                )}
              </div>

              {/* VS */}
              <div className="wl-page-calculator-middle">
                <span>VS</span>
                <div />
              </div>

              {/* Offered clothing */}
              <div className="wl-page-calculator-choice">

                <div className="wl-page-calculator-choice-title">
                  <span className="wl-page-calculator-number">
                    02
                  </span>

                  <div>
                    <span>WHAT YOU OFFER</span>
                    <h3>Your clothing</h3>
                  </div>
                </div>

                <div className="wl-page-calculator-preview">
                  {renderClothingImage(offeredItem)}

                  <div>
                    <strong>
                      {offeredItem?.title || "Choose an item"}
                    </strong>

                    <span>
                      {offeredItem
                        ? offeredItem.category || "Clothing"
                        : "Select from your available wardrobe"}
                    </span>

                    <b>
                      {offeredItem
                        ? formatValue(getValue(offeredItem))
                        : "—"}
                    </b>
                  </div>
                </div>

                <label className="wl-page-calculator-label">
                  Select your offered item

                  <select
                    value={offeredId}
                    onChange={(event) => {
                      setOfferedId(event.target.value);
                      setComparison(null);
                      setError("");
                    }}
                  >
                    <option value="">Choose your clothing</option>

                    {offeredClothes.map((clothing) => (
                      <option
                        key={clothing._id}
                        value={clothing._id}
                      >
                        {clothing.title} —{" "}
                        {formatValue(getValue(clothing))}
                      </option>
                    ))}
                  </select>
                </label>

                {offeredItem && (
                  <div className="wl-page-calculator-meta">
                    <span>
                      Size: {offeredItem.size || "Not specified"}
                    </span>

                    <span>
                      Condition:{" "}
                      {offeredItem.condition || "Not specified"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Empty listing messages */}
            {requestedClothes.length === 0 && (
              <p className="wl-page-calculator-hint">
                No available clothing from other members was found.
              </p>
            )}

            {offeredClothes.length === 0 && (
              <p className="wl-page-calculator-hint">
                You don't have any available clothing to offer yet.

                <button
                  type="button"
                  onClick={() => navigate("/add-clothing")}
                >
                  List your first item →
                </button>
              </p>
            )}

            {/* Error */}
            {error && (
              <div className="wl-page-calculator-error">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="wl-page-calculator-actions">
              <button
                type="button"
                className="wl-page-calculator-compare"
                onClick={calculateComparison}
                disabled={!requestedId || !offeredId}
              >
                Compare swap values <span>→</span>
              </button>

              <button
                type="button"
                className="wl-page-calculator-reset"
                onClick={handleReset}
              >
                Reset comparison
              </button>
            </div>

            {/* Comparison result */}
            {comparison?.error && (
              <div className="wl-page-calculator-error">
                {comparison.error}
              </div>
            )}

            {comparison && !comparison.error && (
              <section className="wl-page-calculator-result">

                {/* Result heading */}
                <div className="wl-page-calculator-result-top">
                  <div>
                    <span className="wl-page-calculator-eyebrow">
                      YOUR SWAP ANALYSIS
                    </span>

                    <h3>Here's how your offer compares.</h3>
                  </div>

                  <span
                    className={`wl-page-calculator-status ${comparison.resultClass}`}
                  >
                    {comparison.result}
                  </span>
                </div>

                {/* Value summary */}
                <div className="wl-page-calculator-result-numbers">

                  <div>
                    <span>Requested value</span>
                    <strong>
                      {formatValue(comparison.requestedValue)}
                    </strong>
                  </div>

                  <div>
                    <span>Offered value</span>
                    <strong>
                      {formatValue(comparison.offeredValue)}
                    </strong>
                  </div>

                  <div>
                    <span>Value difference</span>
                    <strong>
                      {formatValue(comparison.difference)}
                    </strong>
                  </div>

                </div>

                {/* Visual comparison */}
                <div className="wl-page-calculator-visual">

                  <div className="wl-page-calculator-visual-heading">
                    <div>
                      <span className="wl-page-calculator-eyebrow">
                        VISUAL VALUE COMPARISON
                      </span>

                      <h4>How close are the two values?</h4>
                    </div>

                    <span className="wl-page-calculator-visual-percent">
                      {comparison.percentage.toFixed(1)}% difference
                    </span>
                  </div>

                  {/* Requested value bar */}
                  <div className="wl-page-calculator-visual-row">
                    <div className="wl-page-calculator-visual-label">
                      <span>Requested clothing</span>

                      <strong>
                        {formatValue(comparison.requestedValue)}
                      </strong>
                    </div>

                    <div className="wl-page-calculator-visual-track">
                      <div
                        className="wl-page-calculator-visual-fill requested"
                        style={{
                          width: getBarWidth(
                            comparison.requestedValue,
                            comparison
                          )
                        }}
                      />
                    </div>
                  </div>

                  {/* Offered value bar */}
                  <div className="wl-page-calculator-visual-row">
                    <div className="wl-page-calculator-visual-label">
                      <span>Your offered clothing</span>

                      <strong>
                        {formatValue(comparison.offeredValue)}
                      </strong>
                    </div>

                    <div className="wl-page-calculator-visual-track">
                      <div
                        className="wl-page-calculator-visual-fill offered"
                        style={{
                          width: getBarWidth(
                            comparison.offeredValue,
                            comparison
                          )
                        }}
                      />
                    </div>
                  </div>

                </div>

                {/* Percentage meter */}
                <div className="wl-page-calculator-meter">

                  <div>
                    <span>Value difference</span>

                    <strong>
                      {comparison.percentage.toFixed(1)}%
                    </strong>
                  </div>

                  <div className="wl-page-calculator-meter-track">
                    <div
                      style={{
                        width: `${Math.min(
                          comparison.percentage,
                          100
                        )}%`
                      }}
                    />
                  </div>

                </div>

                {/* SMART SWAP ADVISOR */}
                <div
                  className={`wl-smart-advisor ${
                    comparison.percentage <= 10
                      ? "advisor-balanced"
                      : comparison.percentage <= 20
                      ? "advisor-negotiate"
                      : "advisor-review"
                  }`}
                >

                  <div className="wl-smart-advisor-header">
                    <span className="wl-page-calculator-eyebrow">
                      WEARLOOP SMART FEATURE
                    </span>

                    <span className="wl-smart-advisor-icon">
                      ✳
                    </span>
                  </div>

                  <h3>Smart Swap Advisor</h3>

                  {/* Balanced swap */}
                  {comparison.percentage <= 10 && (
                    <>
                      <h4>Looks like a good match!</h4>

                      <p>
                        Both clothing values are quite close.
                        You can consider proceeding with this swap.
                      </p>

                      <strong className="wl-smart-advisor-status">
                        ✓ Recommended: Proceed with swap
                      </strong>
                    </>
                  )}

                  {/* Small difference */}
                  {comparison.percentage > 10 &&
                    comparison.percentage <= 20 && (
                      <>
                        <h4>A small adjustment may help.</h4>

                        <p>
                          There is a small difference between
                          the two clothing values. Consider
                          discussing an adjustment before accepting.
                        </p>

                        <strong className="wl-smart-advisor-status">
                          ↔ Recommended: Consider negotiating
                        </strong>
                      </>
                    )}

                  {/* Large difference */}
                  {comparison.percentage > 20 && (
                    <>
                      <h4>This swap needs another look.</h4>

                      <p>
                        The difference between the listed values
                        is considerable. Review the offer and
                        discuss a fair adjustment before proceeding.
                      </p>

                      <strong className="wl-smart-advisor-status">
                        ! Recommended: Review the offer
                      </strong>
                    </>
                  )}

                  {/* Suggested adjustment */}
                  {comparison.percentage > 10 && (
                    <div className="wl-smart-advisor-adjustment">

                      <span>Suggested value adjustment</span>

                      <strong>
                        {formatValue(comparison.difference)}
                      </strong>

                      <p>
                        {comparison.offeredValue <
                        comparison.requestedValue
                          ? "Your offered item has a lower listed value. Consider adding an item or value worth approximately this difference."
                          : "Your offered item has a higher listed value. Consider discussing an additional item or adjustment from the other member."}
                      </p>

                    </div>
                  )}

                  <small>
                    This recommendation uses listed clothing
                    values only. Actual swap decisions should
                    consider condition, quality and personal
                    preferences.
                  </small>

                </div>

                {/* Disclaimer */}
                <p className="wl-page-calculator-result-note">
                  This comparison is based on the estimated values
                  listed by members. It is a guide, not a guarantee
                  of market value or swap fairness.
                </p>

              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default SwapValueCalculator;
