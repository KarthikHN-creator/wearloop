
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function MyClothing() {
  const navigate = useNavigate();

  const [clothes, setClothes] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const emptyForm = {
    title: "",
    category: "",
    size: "",
    brand: "",
    condition: "",
    description: "",
    value: "",
    location: "",
    image: "",
    status: "Available",
  };

  const [form, setForm] = useState(emptyForm);

  // Show notification message
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3500);
  };

  // Fetch the logged-in user's clothing
  const fetchMyClothes = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first.");
        setMessageType("error");
        setClothes([]);
        return;
      }

      const profileResponse = await API.get("/users/profile");
      const currentUser = profileResponse.data;

      const currentUserId = String(
        currentUser?.id || currentUser?._id || ""
      );

      if (!currentUserId) {
        setMessage("Unable to identify your account. Please login again.");
        setMessageType("error");
        setClothes([]);
        return;
      }

      const response = await API.get("/clothes");

      const allClothes = Array.isArray(response.data)
        ? response.data
        : [];

      const myClothes = allClothes.filter((item) => {
        let ownerId = "";

        if (item.owner) {
          if (typeof item.owner === "object") {
            ownerId = String(
              item.owner._id || item.owner.id || ""
            );
          } else {
            ownerId = String(item.owner);
          }
        }

        return ownerId === currentUserId;
      });

      setClothes(myClothes);
    } catch (error) {
      console.error("Failed to fetch my clothing:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setClothes([]);
        setMessage("Your login session has expired. Please login again.");
        setMessageType("error");
        return;
      }

      setClothes([]);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch your clothing"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClothes();
  }, []);

  // Statistics
  const availableCount = clothes.filter(
    (item) => item.status === "Available"
  ).length;

  const reservedCount = clothes.filter(
    (item) => item.status === "Reserved"
  ).length;

  const swappedCount = clothes.filter(
    (item) => item.status === "Swapped"
  ).length;

  const totalValue = clothes.reduce(
    (total, item) => total + (Number(item.value) || 0),
    0
  );

  // Search and filter
  const filteredClothes = useMemo(() => {
    return clothes.filter((item) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        item.title?.toLowerCase().includes(searchText) ||
        item.brand?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText) ||
        item.location?.toLowerCase().includes(searchText);

      const matchesFilter =
        activeFilter === "All" ||
        item.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [clothes, search, activeFilter]);

  // Delete listing
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this clothing item?\n\nThis action cannot be undone."
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showMessage("Please login first.", "error");
        return;
      }

      setDeletingId(id);

      await API.delete(`/clothes/${id}`);

      setClothes((previous) =>
        previous.filter((item) => item._id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      showMessage("Clothing deleted successfully.");
    } catch (error) {
      console.error("Delete error:", error);

      showMessage(
        error.response?.data?.message ||
          "Failed to delete clothing",
        "error"
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Open edit form
  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      title: item.title || "",
      category: item.category || "",
      size: item.size || "",
      brand: item.brand || "",
      condition: item.condition || "",
      description: item.description || "",
      value: item.value ?? "",
      location: item.location || "",
      image: item.image || "",
      status: item.status || "Available",
    });

    setMessage("");
    setMessageType("");

    window.setTimeout(() => {
      document
        .getElementById("wl-edit-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  };

  // Form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save changes
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingId) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        showMessage("Please login first.", "error");
        return;
      }

      setUpdating(true);

      const response = await API.patch(
        `/clothes/${editingId}`,
        {
          ...form,
          value: Number(form.value) || 0,
        }
      );

      const updatedItem = response.data?.clothing ||
        response.data?.item ||
        null;

      setClothes((previous) =>
        previous.map((item) =>
          item._id === editingId
            ? {
                ...item,
                ...form,
                value: Number(form.value) || 0,
                ...(updatedItem || {}),
              }
            : item
        )
      );

      setEditingId(null);
      setForm(emptyForm);

      showMessage(
        response.data.message || "Clothing updated successfully."
      );
    } catch (error) {
      console.error("Update error:", error);

      showMessage(
        error.response?.data?.message ||
          "Failed to update clothing",
        "error"
      );
    } finally {
      setUpdating(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setMessageType("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Available":
        return "wl-status-available";
      case "Reserved":
        return "wl-status-reserved";
      case "Swapped":
        return "wl-status-swapped";
      case "Archived":
        return "wl-status-archived";
      default:
        return "";
    }
  };

  // Loading screen
  if (loading) {
    return (
      <main className="wl-wardrobe-page">
        <div className="wl-wardrobe-loading">
          <div className="wl-wardrobe-spinner" />
          <p className="wl-eyebrow">WEARLOOP WARDROBE</p>
          <h2>Opening your closet...</h2>
          <p>Getting your clothing collection ready.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="wl-wardrobe-page">
      <div className="wl-wardrobe-container">

        {/* Page header */}
        <header className="wl-wardrobe-header">
          <div>
            <p className="wl-eyebrow">YOUR PERSONAL COLLECTION</p>
            <h1>
              My <span>Wardrobe.</span>
            </h1>
            <p className="wl-wardrobe-intro">
              Every piece has a story. Keep track of the clothes
              you've listed and give them another chance.
            </p>
          </div>

          <button
            className="wl-wardrobe-add-button"
            onClick={() => navigate("/add-clothing")}
          >
            <span>＋</span> List new clothing
          </button>
        </header>

        {/* Notification */}
        {message && (
          <div
            className={`wl-wardrobe-message ${
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
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* Statistics */}
        <section className="wl-wardrobe-stats">
          <div className="wl-wardrobe-stat">
            <span className="wl-eyebrow">TOTAL LISTINGS</span>
            <strong>{clothes.length}</strong>
            <small>Pieces in your wardrobe</small>
          </div>

          <div className="wl-wardrobe-stat">
            <span className="wl-eyebrow">AVAILABLE</span>
            <strong>{availableCount}</strong>
            <small>Ready for a new owner</small>
          </div>

          <div className="wl-wardrobe-stat">
            <span className="wl-eyebrow">RESERVED</span>
            <strong>{reservedCount}</strong>
            <small>Waiting for an exchange</small>
          </div>

          <div className="wl-wardrobe-stat">
            <span className="wl-eyebrow">SWAPPED</span>
            <strong>{swappedCount}</strong>
            <small>Given a new story</small>
          </div>

          <div className="wl-wardrobe-stat wl-wardrobe-value-stat">
            <span className="wl-eyebrow">TOTAL ESTIMATED VALUE</span>
            <strong>
              ₹{totalValue.toLocaleString("en-IN")}
            </strong>
            <small>Across all your listings</small>
          </div>
        </section>

        {/* Edit form */}
        {editingId && (
          <section
            className="wl-edit-section"
            id="wl-edit-form"
          >
            <div className="wl-edit-heading">
              <div>
                <p className="wl-eyebrow">UPDATE YOUR LISTING</p>
                <h2>Edit clothing</h2>
                <p>Make changes to the details of this piece.</p>
              </div>

              <button
                type="button"
                className="wl-edit-close"
                onClick={handleCancelEdit}
                aria-label="Close edit form"
              >
                ×
              </button>
            </div>

            <form
              className="wl-edit-grid"
              onSubmit={handleUpdate}
            >
              <div className="wl-edit-field wl-edit-full">
                <label htmlFor="wl-title">Clothing title *</label>
                <input
                  id="wl-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Example: Premium Black Hoodie"
                  required
                />
              </div>

              <div className="wl-edit-field">
                <label htmlFor="wl-category">Category *</label>
                <select
                  id="wl-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  {[
                    "T-Shirt", "Shirt", "Jeans", "Trousers",
                    "Jacket", "Dress", "Skirt", "Sweater",
                    "Hoodie", "Other",
                  ].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="wl-edit-field">
                <label htmlFor="wl-size">Size *</label>
                <select
                  id="wl-size"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select size</option>
                  {["XS", "S", "M", "L", "XL", "XXL"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="wl-edit-field">
                <label htmlFor="wl-brand">Brand</label>
                <input
                  id="wl-brand"
                  name="brand"
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="Example: Puma"
                />
              </div>

              <div className="wl-edit-field">
                <label htmlFor="wl-condition">Condition *</label>
                <select
                  id="wl-condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select condition</option>
                  {["New", "Like New", "Good", "Fair"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="wl-edit-field">
                <label htmlFor="wl-value">Estimated value (₹)</label>
                <input
                  id="wl-value"
                  type="number"
                  name="value"
                  min="0"
                  value={form.value}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div className="wl-edit-field">
                <label htmlFor="wl-location">Location</label>
                <input
                  id="wl-location"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="Example: Bengaluru"
                />
              </div>

              <div className="wl-edit-field">
                <label htmlFor="wl-status">Listing status</label>
                <select
                  id="wl-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {["Available", "Reserved", "Swapped", "Archived"].map(
                    (value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="wl-edit-field wl-edit-full">
                <label htmlFor="wl-image">Image URL</label>
                <input
                  id="wl-image"
                  name="image"
                  value={form.image}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
                <small>Paste a publicly accessible image URL.</small>
              </div>

              {form.image && (
                <div className="wl-edit-preview wl-edit-full">
                  <img
                    src={form.image}
                    alt="Clothing preview"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span>Image preview</span>
                </div>
              )}

              <div className="wl-edit-field wl-edit-full">
                <label htmlFor="wl-description">Description</label>
                <textarea
                  id="wl-description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Describe your clothing item..."
                />
              </div>

              <div className="wl-edit-actions wl-edit-full">
                <button
                  type="button"
                  className="wl-edit-cancel"
                  onClick={handleCancelEdit}
                  disabled={updating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="wl-edit-save"
                  disabled={updating}
                >
                  {updating ? "Saving changes..." : "Save changes"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Search and filters */}
        <section className="wl-wardrobe-toolbar">
          <div>
            <p className="wl-eyebrow">YOUR COLLECTION</p>
            <h2>All your pieces</h2>
          </div>

          <div className="wl-wardrobe-controls">
            <div className="wl-wardrobe-search">
              <span>⌕</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your wardrobe..."
                aria-label="Search your wardrobe"
              />
            </div>

            <select
              className="wl-wardrobe-filter"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              aria-label="Filter clothing by status"
            >
              <option value="All">All status</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Swapped">Swapped</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </section>

        {/* Empty wardrobe */}
        {clothes.length === 0 && (
          <section className="wl-wardrobe-empty">
            <div className="wl-wardrobe-empty-icon">W</div>
            <p className="wl-eyebrow">A FRESH START</p>
            <h2>Your wardrobe is waiting.</h2>
            <p>
              You haven't listed any clothing yet. Add your first
              piece and give it another life.
            </p>
            <button
              className="wl-wardrobe-add-button"
              onClick={() => navigate("/add-clothing")}
            >
              ＋ List your first item
            </button>
          </section>
        )}

        {/* No search results */}
        {clothes.length > 0 && filteredClothes.length === 0 && (
          <section className="wl-wardrobe-empty wl-wardrobe-no-results">
            <div className="wl-wardrobe-empty-icon">⌕</div>
            <h2>No matching pieces found.</h2>
            <p>Try another search term or change the status filter.</p>
            <button
              className="wl-wardrobe-reset"
              onClick={() => {
                setSearch("");
                setActiveFilter("All");
              }}
            >
              Clear search and filters
            </button>
          </section>
        )}

        {/* Clothing grid */}
        {filteredClothes.length > 0 && (
          <>
            <div className="wl-wardrobe-results">
              Showing <strong>{filteredClothes.length}</strong>
              {" "}of <strong>{clothes.length}</strong> listings
            </div>

            <section className="wl-wardrobe-grid">
              {filteredClothes.map((item) => (
                <article
                  className="wl-wardrobe-card"
                  key={item._id}
                >
                  <div className="wl-wardrobe-card-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement.classList.add(
                            "has-image-error"
                          );
                        }}
                      />
                    ) : (
                      <div className="wl-wardrobe-image-placeholder">
                        <span>W</span>
                        <small>IMAGE NOT AVAILABLE</small>
                      </div>
                    )}

                    <span
                      className={`wl-wardrobe-status ${getStatusClass(
                        item.status
                      )}`}
                    >
                      {item.status || "Available"}
                    </span>

                    <span className="wl-wardrobe-category-tag">
                      {item.category || "Clothing"}
                    </span>
                  </div>

                  <div className="wl-wardrobe-card-body">
                    <div className="wl-wardrobe-card-title">
                      <div>
                        <p className="wl-eyebrow">
                          {item.brand || "PRE-LOVED FASHION"}
                        </p>
                        <h3>{item.title}</h3>
                      </div>
                      <span className="wl-wardrobe-size">
                        {item.size || "—"}
                      </span>
                    </div>

                    <div className="wl-wardrobe-card-details">
                      <div>
                        <span>CONDITION</span>
                        <strong>{item.condition || "Not specified"}</strong>
                      </div>
                      <div>
                        <span>LOCATION</span>
                        <strong>{item.location || "Not specified"}</strong>
                      </div>
                    </div>

                    <div className="wl-wardrobe-card-value">
                      <span>ESTIMATED VALUE</span>
                      <strong>
                        ₹{Number(item.value || 0).toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="wl-wardrobe-card-actions">
                      <button
                        type="button"
                        className="wl-wardrobe-edit-button"
                        onClick={() => handleEdit(item)}
                      >
                        Edit listing
                      </button>

                      <button
                        type="button"
                        className="wl-wardrobe-delete-button"
                        onClick={() => handleDelete(item._id)}
                        disabled={deletingId === item._id}
                      >
                        {deletingId === item._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </>
        )}

        {/* Bottom banner */}
        {clothes.length > 0 && (
          <section className="wl-wardrobe-banner">
            <div>
              <p className="wl-eyebrow">MAKE ROOM FOR SOMETHING NEW</p>
              <h2>
                One person's old favourite
                <br />
                could be your next favourite.
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate("/")}
            >
              Explore marketplace ↗
            </button>
          </section>
        )}

        <footer className="wl-wardrobe-footer">
          <strong>WEARLOOP</strong>
          <span>Wear it. Swap it. Love it again.</span>
        </footer>
      </div>
    </main>
  );
}

export default MyClothing;
