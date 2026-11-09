
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

function PublicMemberProfile() {
  const { userId } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await API.get(`/users/${userId}/public`);
        setProfile(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load member profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return <div className="wl-public-state">Loading member profile...</div>;
  }

  if (error) {
    return <div className="wl-public-state">{error}</div>;
  }

  if (!profile) {
    return <div className="wl-public-state">Member not found.</div>;
  }

  return (
    <main className="wl-public-profile">
      <section className="wl-public-hero">
        <div className="wl-public-avatar">
          {profile.profileImage ? (
            <img src={profile.profileImage} alt={profile.name} />
          ) : (
            <span>{profile.name?.charAt(0)?.toUpperCase() || "W"}</span>
          )}
        </div>

        <div className="wl-public-info">
          <p className="wl-public-eyebrow">WEARLOOP COMMUNITY MEMBER</p>
          <h1>{profile.name}</h1>
          <p>{profile.location || "Location not added"}</p>

          {profile.isVerifiedSwapMember && (
            <span className="wl-profile-verified-badge">
              ✓ Verified Swap Member
            </span>
          )}
        </div>
      </section>

      <section className="wl-public-stats">
        <div>
          <strong>{profile.completedSwaps}</strong>
          <span>Completed Swaps</span>
        </div>

        <div>
          <strong>{profile.rating ? `${profile.rating} / 5` : "—"}</strong>
          <span>Average Rating</span>
        </div>

        <div>
          <strong>{profile.reviewCount}</strong>
          <span>Reviews</span>
        </div>

        <div>
          <strong>{profile.clothingCount}</strong>
          <span>Available Listings</span>
        </div>
      </section>

      <section className="wl-public-reviews">
        <h2>Community Reviews</h2>

        {profile.reviews?.length > 0 ? (
          <div className="wl-public-review-list">
            {profile.reviews.map((review, index) => (
              <article
                className="wl-public-review"
                key={`${review.reviewedAt}-${index}`}
              >
                <div className="wl-public-review-heading">
                  <div className="wl-public-review-avatar">
                    {review.reviewer?.profileImage ? (
                      <img
                        src={review.reviewer.profileImage}
                        alt={review.reviewer.name}
                      />
                    ) : (
                      <span>
                        {review.reviewer?.name?.charAt(0)?.toUpperCase() || "W"}
                      </span>
                    )}
                  </div>

                  <div>
                    <strong>
                      {review.reviewer?.name || "WearLoop Member"}
                    </strong>
                    <p className="wl-public-stars">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </p>
                  </div>

                  <small>
                    {review.reviewedAt
                      ? new Date(review.reviewedAt).toLocaleDateString()
                      : ""}
                  </small>
                </div>

                {review.comment && <p>{review.comment}</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="wl-public-empty">
            This member has not received any reviews yet.
          </p>
        )}
      </section>
    </main>
  );
}

export default PublicMemberProfile;
