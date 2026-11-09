
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function EditProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    profileImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch existing profile information
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await API.get("/users/profile");

        // Supports both response formats
        const user = response.data.user || response.data;

        setFormData({
          name: user.name || "",
          location: user.location || "",
          profileImage: user.profileImage || "",
        });
      } catch (error) {
        console.error("Edit profile fetch error:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }

        setError(
          error.response?.data?.message ||
          "Failed to load profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save profile information
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await API.patch("/users/profile", {
        name: formData.name.trim(),
        location: formData.location.trim(),
        profileImage: formData.profileImage.trim(),
      });

      // Supports both response formats
      const updatedUser = response.data.user || response.data;

      setSuccess("Your profile has been updated successfully!");

      // Update localStorage user information
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const oldUser = JSON.parse(storedUser);

          localStorage.setItem(
            "user",
            JSON.stringify({
              ...oldUser,
              ...updatedUser,
            })
          );
        } catch (storageError) {
          console.error(
            "LocalStorage update error:",
            storageError
          );
        }
      }

      // Navigate back to profile
      setTimeout(() => {
        navigate("/profile");
      }, 1000);

    } catch (error) {
      console.error("Edit profile update error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message ||
        "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="wl-edit-loading">
        <div className="wl-edit-spinner"></div>
        <p>Preparing your profile...</p>
      </div>
    );
  }

  // Error screen
  if (error && !formData.name) {
    return (
      <div className="wl-edit-error-page">
        <div className="wl-edit-error-card">
          <span>!</span>
          <h2>Couldn't load your profile</h2>
          <p>{error}</p>

          <button onClick={() => navigate("/profile")}>
            Back to profile
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = formData.profileImage.trim();

  return (
    <div className="wl-edit-page">
      <div className="wl-edit-container">

        {/* Back button */}
        <button
          type="button"
          className="wl-edit-back"
          onClick={() => navigate("/profile")}
        >
          <span>←</span> Back to profile
        </button>

        {/* Page heading */}
        <div className="wl-edit-heading">
          <div>
            <span className="wl-edit-eyebrow">
              YOUR ACCOUNT
            </span>

            <h1>
              Edit your profile<span>.</span>
            </h1>

            <p>
              Keep your details up to date and make your
              WearLoop experience feel more personal.
            </p>
          </div>

          <div className="wl-edit-heading-icon">
            ✳
          </div>
        </div>

        <div className="wl-edit-layout">

          {/* Edit form */}
          <section className="wl-edit-card">

            <div className="wl-edit-card-heading">
              <div>
                <span className="wl-edit-section-label">
                  PERSONAL DETAILS
                </span>

                <h2>About you</h2>
              </div>

              <span className="wl-edit-step">
                01 / 01
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className="wl-edit-alert wl-edit-alert-error">
                <span>!</span>
                {error}
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="wl-edit-alert wl-edit-alert-success">
                <span>✓</span>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* Full name */}
              <div className="wl-edit-field">
                <label htmlFor="name">
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />

                <small>
                  This is how other members will see you.
                </small>
              </div>

              {/* Location */}
              <div className="wl-edit-field">
                <label htmlFor="location">
                  Your location
                </label>

                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Bengaluru, India"
                />

                <small>
                  Help nearby members discover your listings.
                </small>
              </div>

              {/* Profile image URL */}
              <div className="wl-edit-field">
                <label htmlFor="profileImage">
                  Profile image URL
                </label>

                <input
                  id="profileImage"
                  type="url"
                  name="profileImage"
                  value={formData.profileImage}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />

                <small>
                  Paste a publicly accessible image URL.
                </small>
              </div>

              {/* Form buttons */}
              <div className="wl-edit-form-actions">

                <button
                  type="button"
                  className="wl-edit-cancel"
                  onClick={() => navigate("/profile")}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="wl-edit-save"
                  disabled={saving}
                >
                  {saving ? "Saving changes..." : "Save changes"}

                  {!saving && <span>→</span>}
                </button>

              </div>
            </form>
          </section>

          {/* Live profile preview */}
          <aside className="wl-edit-preview-card">

            <span className="wl-edit-section-label">
              LIVE PREVIEW
            </span>

            <div className="wl-edit-preview-content">

              <div className="wl-edit-avatar">

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Profile preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>
                    {formData.name.trim()
                      ? formData.name.trim().charAt(0).toUpperCase()
                      : "W"}
                  </span>
                )}

              </div>

              <span className="wl-edit-member-tag">
                WEARLOOP MEMBER
              </span>

              <h2>
                {formData.name.trim() || "Your name"}
              </h2>

              <p>
                <span>⌖</span>{" "}
                {formData.location.trim() || "Your location"}
              </p>

            </div>

            <div className="wl-edit-preview-footer">
              <span>✳</span>

              <p>
                Wear it. Swap it. Love it again.
              </p>
            </div>

          </aside>
        </div>

        <p className="wl-edit-footer-note">
          Your profile helps make every swap more personal.
        </p>

      </div>
    </div>
  );
}

export default EditProfile;
