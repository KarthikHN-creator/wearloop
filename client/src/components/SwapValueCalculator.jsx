import { useState } from "react";

function SwapValueCalculator({ currentClothing, clothes = [] }) {
  const [selectedId, setSelectedId] = useState("");

  if (!currentClothing) {
    return null;
  }

  const selectedClothing = clothes.find(
    (clothing) => clothing._id === selectedId
  );

  const currentValue = Number(currentClothing.value || 0);
  const offeredValue = Number(selectedClothing?.value || 0);

  const difference = Math.abs(
    currentValue - offeredValue
  );

  let result = "";
  let resultClass = "";

  if (selectedClothing) {
    if (difference === 0) {
      result = "🟢 Fair Swap";
      resultClass = "fair";
    } else if (
      difference <= Math.max(currentValue, offeredValue) * 0.2
    ) {
      result = "🟡 Small Difference";
      resultClass = "small";
    } else {
      result = "🔴 Large Difference";
      resultClass = "large";
    }
  }

  return (
    <div className="swap-calculator">
      <h2>💰 Swap Value Calculator</h2>

      <div className="calculator-item">
        <h3>Requested Item</h3>

        <p>
          <strong>{currentClothing.title}</strong>
        </p>

        <p>
          Category: {currentClothing.category}
        </p>

        <p>
          Size: {currentClothing.size}
        </p>

        <p>
          Condition: {currentClothing.condition}
        </p>

        <p className="calculator-value">
          Value: ₹{currentValue}
        </p>
      </div>

      <div className="calculator-divider">
        ⇅
      </div>

      <div className="calculator-item">
        <h3>Your Offered Item</h3>

        {clothes.length === 0 ? (
          <p className="calculator-empty">
            You don't have any available clothing
            to compare.
          </p>
        ) : (
          <>
            <select
              value={selectedId}
              onChange={(e) =>
                setSelectedId(e.target.value)
              }
            >
              <option value="">
                Select your clothing
              </option>

              {clothes
                .filter(
                  (clothing) =>
                    clothing._id !== currentClothing._id
                )
                .map((clothing) => (
                  <option
                    key={clothing._id}
                    value={clothing._id}
                  >
                    {clothing.title} - ₹
                    {clothing.value || 0}
                  </option>
                ))}
            </select>

            {selectedClothing && (
              <>
                <p>
                  Category:{" "}
                  {selectedClothing.category}
                </p>

                <p>
                  Size: {selectedClothing.size}
                </p>

                <p>
                  Condition:{" "}
                  {selectedClothing.condition}
                </p>

                <p className="calculator-value">
                  Value: ₹{offeredValue}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {selectedClothing && (
        <div className="calculator-result">
          <h3>Swap Analysis</h3>

          <p>
            Value Difference:{" "}
            <strong>₹{difference}</strong>
          </p>

          <div className={`swap-result ${resultClass}`}>
            {result}
          </div>

          <p className="calculator-note">
            This calculation is based on the
            estimated values of both clothing items.
          </p>
        </div>
      )}
    </div>
  );
}

export default SwapValueCalculator;