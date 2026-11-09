
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/users/profile");
      const user = response.data;

      setProfile(user);
      setPreview(user.profileImage || "");
    } catch (error) {
      console.error("Profile fetch error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      setError(
        error.response?.data?.message || "Failed to load profile."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, JPEG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setMessage("");
    setSelectedImage(file);

    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setMessage("");

      const formData = new FormData();
      formData.append("profileImage", selectedImage);

      const response = await API.post(
        "/users/profile/image",
        formData
      );

      const uploadedImage = response.data.profileImage;

      setProfile((previousProfile) => ({
        ...previousProfile,
        profileImage: uploadedImage,
      }));

      setPreview(uploadedImage);
      setSelectedImage(null);

      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          user.profileImage = uploadedImage;
          localStorage.setItem("user", JSON.stringify(user));
        } catch (storageError) {
          console.error("LocalStorage update error:", storageError);
        }
      }

      const fileInput = document.getElementById("profile-image-input");

      if (fileInput) {
        fileInput.value = "";
      }

      setMessage("Profile photo updated successfully!");
    } catch (error) {
      console.error("Profile image upload error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to upload profile photo."
      );
    } finally {
      setUploading(false);
    }
  };

  const cancelImageSelection = () => {
    setSelectedImage(null);
    setPreview(profile?.profileImage || "");
    setError("");

    const fileInput = document.getElementById("profile-image-input");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "N/A";

  if (loading) {
    return (
      <main className="wl-profile-page">
        <div className="wl-profile-container">
          <div className="wl-profile-loading">
            <div className="wl-profile-skeleton" />
            <p>Preparing your profile...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="wl-profile-page">
        <div className="wl-profile-container">
          <div className="wl-profile-empty">
            <span>✳</span>
            <h2>Profile unavailable</h2>
            <p>{error || "Unable to load your profile."}</p>
            <button
              className="wl-profile-primary"
              onClick={fetchProfile}
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const completedSwaps = Number(profile.completedSwaps) || 0;
  const communityRating = Number(profile.rating) || 0;
  const reviewCount = Number(profile.reviewCount) || 0;

  const isVerifiedSwapMember = completedSwaps >= 1;

  const reputationLabel =
    reviewCount === 0
      ? "Not rated yet"
      : communityRating >= 4.5
      ? "Excellent reputation"
      : communityRating >= 4
      ? "Great reputation"
      : communityRating >= 3
      ? "Good reputation"
      : "Building reputation";

  const stats = [
    {
      label: "Clothing items",
      value: profile.clothingCount || 0,
      icon: "01",
    },
    {
      label: "Completed swaps",
      value: completedSwaps,
      icon: "02",
    },
    {
      label: "Total swaps",
      value: profile.totalSwaps || 0,
      icon: "03",
    },
    {
      label: "Community rating",
      value:
        reviewCount > 0
          ? communityRating.toFixed(1)
          : "Not rated",
      icon: "04",
    },
  ];

  return (
    <main className="wl-profile-page">
      <div className="wl-profile-container">

        {/* Page heading */}
        <div className="wl-profile-heading">
          <div>
            <span className="wl-profile-eyebrow">
              YOUR WEARLOOP SPACE
            </span>
            <h1>My profile<span>.</span></h1>
            <p>
              Your account, your wardrobe, your sustainable journey.
            </p>
          </div>

          <button
            className="wl-profile-edit-top"
            onClick={() => navigate("/edit-profile")}
          >
            Edit profile ↗
          </button>
        </div>

        {/* Profile hero */}
        <section className="wl-profile-hero">
          <div className="wl-profile-hero-decoration">W</div>

          <div className="wl-profile-avatar-area">
            <div className="wl-profile-avatar">
              {preview ? (
                <img src={preview} alt="Profile" />
              ) : (
                <span>
                  {profile.name?.charAt(0)?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            <label
              htmlFor="profile-image-input"
              className="wl-profile-photo-button"
            >
              <span>＋</span> Change photo
            </label>

            <input
              id="profile-image-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageChange}
              hidden
            />

            <p className="wl-profile-photo-hint">
              JPG, PNG or WEBP · Max 5 MB
            </p>

            {selectedImage && (
              <div className="wl-profile-upload-controls">
                <button
                  className="wl-profile-upload"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Save photo"}
                </button>

                <button
                  className="wl-profile-cancel"
                  onClick={cancelImageSelection}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="wl-profile-hero-info">
            <span className="wl-profile-member-label">
              WEARLOOP MEMBER
            </span>

            <h2>{profile.name || "User"}</h2>

            <p className="wl-profile-email">{profile.email}</p>

            {profile.location && (
              <p className="wl-profile-location">
                <span>⌖</span> {profile.location}
              </p>
            )}

            <div className="wl-profile-tags">
              <span className="wl-profile-member-tag">
                {profile.role === "admin" ? "Administrator" : "Member"}
              </span>

              {profile.role === "admin" && (
                <span className="wl-profile-admin-tag">
                  Admin account
                </span>
              )}

              {isVerifiedSwapMember && (
                <span className="wl-profile-verified-badge">
                  ✓ Verified Swap
                </span>
              )}
            </div>
          </div>

          <div className="wl-profile-member-since">
            <span>MEMBER SINCE</span>
            <strong>{memberSince}</strong>
          </div>
        </section>

        {/* Feedback */}
        {message && (
          <div className="wl-profile-feedback success" role="status">
            <span>✓</span> {message}
          </div>
        )}

        {error && (
          <div className="wl-profile-feedback error" role="alert">
            <span>!</span> {error}
          </div>
        )}

        {/* Statistics */}
        <section className="wl-profile-stat-section">
          <div className="wl-profile-section-heading">
            <div>
              <span className="wl-profile-eyebrow">YOUR ACTIVITY</span>
              <h2>Your journey so far</h2>
            </div>
          </div>

          <div className="wl-profile-stats">
            {stats.map((stat) => (
              <div className="wl-profile-stat-card" key={stat.label}>
                <span className="wl-profile-stat-number">
                  {stat.icon}
                </span>
                <strong>{stat.value}</strong>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust and reputation */}
        <section className="wl-profile-reputation">
          <div className="wl-profile-section-heading">
            <div>
              <span className="wl-profile-eyebrow">
                TRUST & COMMUNITY
              </span>
              <h2>Your reputation</h2>
            </div>
          </div>

          <div className="wl-profile-reputation-grid">
            <div className="wl-profile-reputation-card">
              <span className="wl-profile-reputation-icon">★</span>
              <div>
                <span>AVERAGE RATING</span>
                <strong>
                  {reviewCount > 0
                    ? `${communityRating.toFixed(1)} / 5`
                    : "Not rated yet"}
                </strong>
                <small>
                  {reviewCount} {reviewCount === 1 ? "review" : "reviews"} received
                </small>
              </div>
            </div>

            <div className="wl-profile-reputation-card">
              <span className="wl-profile-reputation-icon">✓</span>
              <div>
                <span>SWAP STATUS</span>
                <strong>
                  {isVerifiedSwapMember
                    ? "Verified Swap Member"
                    : "New Member"}
                </strong>
                <small>
                  {completedSwaps} completed{" "}
                  {completedSwaps === 1 ? "swap" : "swaps"}
                </small>
              </div>
            </div>

            <div className="wl-profile-reputation-card">
              <span className="wl-profile-reputation-icon">✳</span>
              <div>
                <span>COMMUNITY REPUTATION</span>
                <strong>{reputationLabel}</strong>
                <small>Based on received member ratings</small>
              </div>
            </div>
          </div>

          <p className="wl-profile-reputation-note">
            The Verified Swap badge indicates at least one completed
            clothing exchange on WearLoop. It does not represent
            government or identity verification.
          </p>
        </section>

        {/* Account information */}
        <section className="wl-profile-information">
          <div className="wl-profile-section-heading">
            <div>
              <span className="wl-profile-eyebrow">ACCOUNT DETAILS</span>
              <h2>Personal information</h2>
            </div>

            <button
              className="wl-profile-text-button"
              onClick={() => navigate("/edit-profile")}
            >
              Edit details ↗
            </button>
          </div>

          <div className="wl-profile-info-grid">
            <div className="wl-profile-info-item">
              <span>FULL NAME</span>
              <strong>{profile.name || "Not specified"}</strong>
            </div>

            <div className="wl-profile-info-item">
              <span>EMAIL ADDRESS</span>
              <strong>{profile.email || "Not specified"}</strong>
            </div>

            <div className="wl-profile-info-item">
              <span>LOCATION</span>
              <strong>{profile.location || "Not specified"}</strong>
            </div>

            <div className="wl-profile-info-item">
              <span>ACCOUNT TYPE</span>
              <strong>
                {profile.role === "admin" ? "Administrator" : "Regular User"}
              </strong>
            </div>

            <div className="wl-profile-info-item">
              <span>MEMBER SINCE</span>
              <strong>{memberSince}</strong>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="wl-profile-quick-actions">
          <div className="wl-profile-section-heading">
            <div>
              <span className="wl-profile-eyebrow">MAKE THE MOST OF IT</span>
              <h2>Quick actions</h2>
            </div>
          </div>

          <div className="wl-profile-action-grid">
            <button
              className="wl-profile-action-card featured"
              onClick={() => navigate("/add-clothing")}
            >
              <span className="wl-profile-action-icon">＋</span>
              <span>
                <strong>List an item</strong>
                <small>Add clothing to your wardrobe marketplace.</small>
              </span>
              <span className="wl-profile-action-arrow">↗</span>
            </button>

            <button
              className="wl-profile-action-card"
              onClick={() => navigate("/my-clothing")}
            >
              <span className="wl-profile-action-icon">✳</span>
              <span>
                <strong>My clothing</strong>
                <small>Manage your listed items.</small>
              </span>
              <span className="wl-profile-action-arrow">↗</span>
            </button>

            <button
              className="wl-profile-action-card"
              onClick={() => navigate("/my-swaps")}
            >
              <span className="wl-profile-action-icon">⇄</span>
              <span>
                <strong>My swaps</strong>
                <small>Track your clothing exchanges.</small>
              </span>
              <span className="wl-profile-action-arrow">↗</span>
            </button>

            <button
              className="wl-profile-action-card"
              onClick={() => navigate("/marketplace")}
            >
              <span className="wl-profile-action-icon">⌕</span>
              <span>
                <strong>Marketplace</strong>
                <small>Discover your next favourite piece.</small>
              </span>
              <span className="wl-profile-action-arrow">↗</span>
            </button>
          </div>
        </section>

        <div className="wl-profile-footer-note">
          <span>✳</span>
          Wear it. Swap it. Love it again.
        </div>

      </div>
    </main>
  );
}

export default Profile;
