
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ClothingCard from "../components/ClothingCard";

const categories = [
  "All Categories",
  "Men",
  "Women",
  "Kids",
  "Accessories",
  "Footwear",
];

const sizes = ["All Sizes", "XS", "S", "M", "L", "XL", "XXL"];

const conditions = [
  "All Conditions",
  "New",
  "Like New",
  "Good",
  "Fair",
];

function Marketplace() {
  const navigate = useNavigate();

  const [clothes, setClothes] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [size, setSize] = useState("All Sizes");
  const [brand, setBrand] = useState("All Brands");
  const [condition, setCondition] = useState("All Conditions");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("Available");

  const [showNearby, setShowNearby] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // FETCH CLOTHING
  // =========================================

  const fetchClothes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/clothes");

      setClothes(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Could not load clothing:", err);

      setError(
        "We couldn't load the clothing listings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // FETCH RECOMMENDATIONS
  // =========================================

  const fetchRecommendations = async () => {
    if (!localStorage.getItem("token")) {
      setRecommendations([]);
      return;
    }

    try {
      const response = await API.get("/clothes/recommendations");

      setRecommendations(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.log(
        "Recommendations are not available:",
        err
      );

      setRecommendations([]);
    }
  };

  // =========================================
  // INITIAL DATA
  // =========================================

  useEffect(() => {
    fetchClothes();
    fetchRecommendations();
  }, []);

  // =========================================
  // DYNAMIC BRAND OPTIONS
  // =========================================

  const brands = useMemo(() => {
    const availableBrands = clothes
      .map((item) => item.brand?.trim())
      .filter(Boolean);

    return [
      "All Brands",
      ...Array.from(new Set(availableBrands)).sort(
        (a, b) => a.localeCompare(b)
      ),
    ];
  }, [clothes]);

  // =========================================
  // NEARBY CLOTHING
  // =========================================

  const getMyLocation = () => {
    let user = {};

    try {
      user = JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      user = {};
    }

    if (!user.location) {
      alert(
        "Please add your location to your profile first."
      );

      navigate("/profile");
      return;
    }

    setLocation(user.location);
    setShowNearby(true);
  };

  // =========================================
  // FILTER CLOTHING
  // =========================================

  const filteredClothes = useMemo(() => {
    return clothes.filter((item) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        item.title?.toLowerCase().includes(searchText) ||
        item.brand?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All Categories" ||
        item.category?.toLowerCase() ===
          category.toLowerCase();

      const matchesSize =
        size === "All Sizes" ||
        item.size?.toLowerCase() === size.toLowerCase();

      const matchesBrand =
        brand === "All Brands" ||
        item.brand?.toLowerCase() === brand.toLowerCase();

      const matchesCondition =
        condition === "All Conditions" ||
        item.condition?.toLowerCase() ===
          condition.toLowerCase();

      const matchesLocation =
        !location ||
        item.location?.toLowerCase().includes(
          location.toLowerCase()
        );

      const matchesAvailability =
        availability === "All Items" ||
        item.status?.toLowerCase() ===
          availability.toLowerCase();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSize &&
        matchesBrand &&
        matchesCondition &&
        matchesLocation &&
        matchesAvailability
      );
    });
  }, [
    clothes,
    search,
    category,
    size,
    brand,
    condition,
    location,
    availability,
  ]);

  // =========================================
  // CLEAR FILTERS
  // =========================================

  const clearFilters = () => {
    setSearch("");
    setCategory("All Categories");
    setSize("All Sizes");
    setBrand("All Brands");
    setCondition("All Conditions");
    setLocation("");
    setAvailability("Available");
    setShowNearby(false);
  };

  const hasActiveFilters =
    search !== "" ||
    category !== "All Categories" ||
    size !== "All Sizes" ||
    brand !== "All Brands" ||
    condition !== "All Conditions" ||
    location !== "" ||
    availability !== "Available";

  // =========================================
  // MAIN UI
  // =========================================

  return (
    <main className="wl-marketplace">

      {/* HERO SECTION */}

      <section className="wl-hero">

        <div className="wl-hero-copy">

          <span className="wl-eyebrow">
            A NEW WAY TO REFRESH YOUR WARDROBE
          </span>

          <h1>
            Good style.
            <br />
            <span>Second chances.</span>
          </h1>

          <p>
            Discover pre-loved fashion, exchange pieces
            you no longer wear, and give great clothes
            another story.
          </p>

          <div className="wl-hero-actions">

            <button
              className="wl-button wl-button-dark"
              onClick={() => navigate("/add-clothing")}
            >
              List your clothing <span>↗</span>
            </button>

            <a
              href="#wl-discover"
              className="wl-text-link"
            >
              Explore the collection ↓
            </a>

          </div>

          <div className="wl-hero-note">
            <span className="wl-note-dot" />
            Fashion goes further when we share.
          </div>

        </div>

        {/* HERO IMAGE */}

        <div className="wl-hero-art">

          <div className="wl-hero-image">

            <img
              src="/wearloop-hero.png"
              alt="WearLoop sustainable fashion collection"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="wl-hero-image-overlay">

              <span>THE CIRCULAR WARDROBE</span>

              <strong>
                Wear it again.
              </strong>

            </div>

          </div>

          <div className="wl-floating-note">

            <span className="wl-floating-icon">
              ↻
            </span>

            <span>
              <strong>
                Swap, don't shop.
              </strong>

              <small>
                Make every piece count.
              </small>
            </span>

          </div>

          <span className="wl-hero-number">
            01 / DISCOVER
          </span>

        </div>

      </section>

      {/* DISCOVER SECTION */}

      <section
        className="wl-discover-section"
        id="wl-discover"
      >

        <div className="wl-section-heading">

          <div>

            <span className="wl-eyebrow">
              THE COMMUNITY WARDROBE
            </span>

            <h2>
              Find your next favourite.
            </h2>

            <p>
              Unique pieces, shared by people like you.
            </p>

          </div>

          <button
            className="wl-refresh-button"
            onClick={fetchClothes}
            disabled={loading}
          >
            ↻ <span>Refresh</span>
          </button>

        </div>

        {/* RECOMMENDATIONS */}

        {recommendations.length > 0 && (

          <section className="wl-recommendations">

            <div className="wl-subheading">

              <div>

                <span className="wl-eyebrow">
                  PICKED FOR YOU
                </span>

                <h3>
                  Recommended finds
                </h3>

              </div>

            </div>

            <div className="wl-recommendation-grid">

              {recommendations.slice(0, 4).map((item) => (

                <button
                  className="wl-recommendation-card"
                  key={item._id}
                  onClick={() =>
                    navigate(`/clothing/${item._id}`)
                  }
                >

                  <div className="wl-recommendation-image">

                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                      />
                    ) : (
                      <span>WearLoop</span>
                    )}

                  </div>

                  <div className="wl-recommendation-info">

                    <strong>
                      {item.title}
                    </strong>

                    <span>
                      {item.brand ||
                        item.category ||
                        "Pre-loved find"}
                    </span>

                  </div>

                  <span className="wl-recommendation-arrow">
                    ↗
                  </span>

                </button>

              ))}

            </div>

          </section>

        )}

        {/* FILTER PANEL */}

        <div className="wl-filter-panel">

          <div className="wl-filter-top">

            <div>

              <span className="wl-eyebrow">
                EXPLORE
              </span>

              <h3>
                Browse clothing
              </h3>

            </div>

            {hasActiveFilters && (

              <button
                className="wl-clear-button"
                onClick={clearFilters}
              >
                Clear all filters ×
              </button>

            )}

          </div>

          {/* SEARCH */}

          <div className="wl-search-row">

            <label className="wl-search-box">

              <span>⌕</span>

              <input
                type="search"
                placeholder="Search clothing, brands or categories..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </label>

            <button
              className={`wl-nearby-button ${
                showNearby ? "active" : ""
              }`}
              onClick={getMyLocation}
            >
              ◎ Near me
            </button>

          </div>

          {/* FILTERS */}

          <div className="wl-filter-grid">

            <label>

              <span>Category</span>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
              >

                {categories.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}

              </select>

            </label>

            <label>

              <span>Size</span>

              <select
                value={size}
                onChange={(event) =>
                  setSize(event.target.value)
                }
              >

                {sizes.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}

              </select>

            </label>

            {/* BRAND FILTER */}

            <label>

              <span>Brand</span>

              <select
                value={brand}
                onChange={(event) =>
                  setBrand(event.target.value)
                }
              >

                {brands.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}

              </select>

            </label>

            <label>

              <span>Condition</span>

              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value)
                }
              >

                {conditions.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}

              </select>

            </label>

            <label>

              <span>Availability</span>

              <select
                value={availability}
                onChange={(event) =>
                  setAvailability(event.target.value)
                }
              >

                <option value="Available">
                  Available
                </option>

                <option value="All Items">
                  All Items
                </option>

              </select>

            </label>

            <label className="wl-location-filter">

              <span>Location</span>

              <input
                type="text"
                placeholder="Enter city or area"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value);
                  setShowNearby(false);
                }}
              />

            </label>

          </div>

        </div>

        {/* RESULTS HEADING */}

        <div className="wl-results-heading">

          <div>

            <h3>
              The collection
            </h3>

            <span>
              {loading
                ? "Finding pieces..."
                : `${filteredClothes.length} ${
                    filteredClothes.length === 1
                      ? "piece"
                      : "pieces"
                  } to discover`}
            </span>

          </div>

          <span className="wl-results-label">
            PRE-LOVED. RE-LOVED.
          </span>

        </div>

        {/* LOADING */}

        {loading && (

          <div className="wl-state-message">

            <div className="wl-loader" />

            <p>
              Opening the wardrobe...
            </p>

          </div>

        )}

        {/* ERROR */}

        {!loading && error && (

          <div className="wl-state-message">

            <p>{error}</p>

            <button
              className="wl-button wl-button-dark"
              onClick={fetchClothes}
            >
              Try again
            </button>

          </div>

        )}

        {/* EMPTY STATE */}

        {!loading &&
          !error &&
          filteredClothes.length === 0 && (

            <div className="wl-empty-state">

              <span className="wl-empty-icon">
                ⌕
              </span>

              <h3>
                No pieces found just yet.
              </h3>

              <p>
                Try changing your search or clearing
                some filters.
              </p>

              <button
                className="wl-button wl-button-dark"
                onClick={clearFilters}
              >
                Clear filters
              </button>

            </div>

          )}

        {/* CLOTHING GRID */}

        {!loading &&
          !error &&
          filteredClothes.length > 0 && (

            <div className="wl-clothing-grid">

              {filteredClothes.map((item) => (

                <ClothingCard
                  key={item._id}
                  item={item}
                />

              ))}

            </div>

          )}

      </section>

      {/* BOTTOM BANNER */}

      <section className="wl-bottom-banner">

        <div>

          <span className="wl-eyebrow">
            YOUR WARDROBE HAS MORE TO GIVE
          </span>

          <h2>
            One person's unused is another
            person's favourite.
          </h2>

        </div>

        <button
          className="wl-button wl-button-light"
          onClick={() => navigate("/add-clothing")}
        >
          Share a piece <span>↗</span>
        </button>

      </section>

    </main>
  );
}

export default Marketplace;
