
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const initialForm = {
  title: "",
  category: "T-Shirt",
  size: "M",
  brand: "",
  condition: "Good",
  description: "",
  value: "",
  location: "",
  image: "",
};

const categories = [
  "T-Shirt",
  "Shirt",
  "Jeans",
  "Trousers",
  "Jacket",
  "Dress",
  "Skirt",
  "Sweater",
  "Hoodie",
  "Other",
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
const conditions = ["New", "Like New", "Good", "Fair"];

function AddClothing() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (name === "image") {
      setImageError(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please log in before listing your clothing.");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const payload = {
        ...formData,
        value: Number(formData.value) || 0,
      };

      const response = await API.post("/clothes", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(
        response.data.message ||
          "Your clothing has been listed successfully!"
      );
      setMessageType("success");
      setFormData(initialForm);
      setImageError(false);
    } catch (error) {
      console.error("Add clothing error:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to add clothing. Please try again."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="wl-add-page">
      <div className="wl-add-container">

        {/* Page heading */}
        <header className="wl-add-header">
          <div>
            <p className="wl-eyebrow">GIVE YOUR CLOTHES A NEW STORY</p>
            <h1>
              List an <span>item.</span>
            </h1>
            <p className="wl-add-intro">
              Someone else might love what you no longer wear.
              Add your clothing to the community and discover something new.
            </p>
          </div>

          <div className="wl-add-header-note">
            <span>01 / 03</span>
            <strong>ADD DETAILS</strong>
            <div className="wl-add-progress">
              <span />
            </div>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div
            className={`wl-add-message ${
              messageType === "error" ? "is-error" : "is-success"
            }`}
            role="status"
          >
            <span>{messageType === "error" ? "!" : "✓"}</span>
            <p>{message}</p>
            <button
              type="button"
              onClick={() => {
                setMessage("");
                setMessageType("");
              }}
              aria-label="Close message"
            >
              ×
            </button>
          </div>
        )}

        <form className="wl-add-layout" onSubmit={handleSubmit}>

          {/* Left: Form */}
          <section className="wl-add-form-panel">

            <div className="wl-add-section-heading">
              <div className="wl-add-section-number">01</div>
              <div>
                <h2>About your item</h2>
                <p>Start with the essentials.</p>
              </div>
            </div>

            <div className="wl-add-fields">

              <div className="wl-add-field wl-add-full">
                <label htmlFor="wl-title">
                  ITEM TITLE <span>*</span>
                </label>
                <input
                  id="wl-title"
                  type="text"
                  name="title"
                  placeholder="e.g. Classic oversized cotton shirt"
                  value={formData.title}
                  onChange={handleChange}
                  maxLength={100}
                  required
                />
              </div>

              <div className="wl-add-field">
                <label htmlFor="wl-category">CATEGORY <span>*</span></label>
                <select
                  id="wl-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wl-add-field">
                <label htmlFor="wl-size">SIZE <span>*</span></label>
                <select
                  id="wl-size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  required
                >
                  {sizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wl-add-field">
                <label htmlFor="wl-brand">BRAND</label>
                <input
                  id="wl-brand"
                  type="text"
                  name="brand"
                  placeholder="e.g. Nike, Zara, H&M"
                  value={formData.brand}
                  onChange={handleChange}
                />
              </div>

              <div className="wl-add-field">
                <label htmlFor="wl-condition">CONDITION <span>*</span></label>
                <select
                  id="wl-condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  {conditions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wl-add-field wl-add-full">
                <label htmlFor="wl-description">DESCRIPTION</label>
                <textarea
                  id="wl-description"
                  name="description"
                  placeholder="Tell the community about the fabric, fit, style and any details worth knowing..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  maxLength={1000}
                />
                <small>{formData.description.length}/1000 characters</small>
              </div>

            </div>

            <div className="wl-add-divider" />

            <div className="wl-add-section-heading">
              <div className="wl-add-section-number">02</div>
              <div>
                <h2>Value & location</h2>
                <p>Help people understand your listing.</p>
              </div>
            </div>

            <div className="wl-add-fields">

              <div className="wl-add-field">
                <label htmlFor="wl-value">ESTIMATED VALUE (₹)</label>
                <div className="wl-add-price-input">
                  <span>₹</span>
                  <input
                    id="wl-value"
                    type="number"
                    name="value"
                    placeholder="0"
                    value={formData.value}
                    onChange={handleChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="wl-add-field">
                <label htmlFor="wl-location">YOUR LOCATION</label>
                <input
                  id="wl-location"
                  type="text"
                  name="location"
                  placeholder="e.g. Bengaluru"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="wl-add-divider" />

            <div className="wl-add-section-heading">
              <div className="wl-add-section-number">03</div>
              <div>
                <h2>Show it off</h2>
                <p>Add a photo so others can see your item.</p>
              </div>
            </div>

            <div className="wl-add-fields">
              <div className="wl-add-field wl-add-full">
                <label htmlFor="wl-image">IMAGE URL</label>
                <input
                  id="wl-image"
                  type="url"
                  name="image"
                  placeholder="https://example.com/your-clothing-image.jpg"
                  value={formData.image}
                  onChange={handleChange}
                />
                <small>
                  Paste a publicly accessible image URL. Image upload is not
                  enabled in this form.
                </small>
              </div>
            </div>

            {/* Form buttons */}
            <div className="wl-add-actions">
              <button
                type="button"
                className="wl-add-cancel"
                onClick={() => navigate("/my-clothing")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="wl-add-submit"
                disabled={submitting}
              >
                {submitting ? "Publishing..." : "Publish Listing"}
                <span>→</span>
              </button>
            </div>

          </section>

          {/* Right: Preview */}
          <aside className="wl-add-preview-panel">

            <p className="wl-eyebrow">LIVE PREVIEW</p>
            <h2>Your listing</h2>
            <p className="wl-add-preview-intro">
              This is how your item will appear in your wardrobe.
            </p>

            <div className="wl-add-preview-card">
              <div className="wl-add-preview-image">
                {formData.image && !imageError ? (
                  <img
                    src={formData.image}
                    alt="Clothing preview"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="wl-add-preview-placeholder">
                    <span>W</span>
                    <small>
                      {imageError ? "IMAGE COULD NOT LOAD" : "YOUR ITEM PHOTO"}
                    </small>
                  </div>
                )}

                <span className="wl-add-preview-badge">AVAILABLE</span>
              </div>

              <div className="wl-add-preview-content">
                <p className="wl-eyebrow">
                  {formData.brand || "YOUR BRAND"}
                </p>

                <h3>{formData.title || "Your clothing title"}</h3>

                <div className="wl-add-preview-meta">
                  <span>{formData.category}</span>
                  <span>Size {formData.size}</span>
                  <span>{formData.condition}</span>
                </div>

                <div className="wl-add-preview-bottom">
                  <div>
                    <small>ESTIMATED VALUE</small>
                    <strong>
                      ₹{Number(formData.value || 0).toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <span>↗</span>
                </div>
              </div>
            </div>

            <div className="wl-add-preview-tip">
              <span>✳</span>
              <div>
                <strong>A little tip</strong>
                <p>
                  Clear photos, accurate sizes and honest descriptions
                  help your item find its next owner.
                </p>
              </div>
            </div>

            <div className="wl-add-sustainability">
              <span>WEARLOOP PHILOSOPHY</span>
              <p>
                Better style. Less waste. More stories.
              </p>
            </div>

          </aside>
        </form>
      </div>
    </main>
  );
}

export default AddClothing;
