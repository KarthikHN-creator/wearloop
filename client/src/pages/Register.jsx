
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      // Register new user
      await API.post("/auth/register", formData);

      // Automatically log in after registration
      const loginResponse = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const data = loginResponse.data;
      const userData = data.user || data;

      if (!data.token) {
        throw new Error("Login successful but authentication token is missing.");
      }

      // Save authentication token
      localStorage.setItem("token", data.token);

      // Save user details
      const user = {
        id: userData.id || userData._id,
        name: userData.name || formData.name,
        email: userData.email || formData.email,
        location: userData.location || formData.location,
        role: userData.role || "user",
      };

      localStorage.setItem("user", JSON.stringify(user));

      // Redirect to Marketplace homepage
      navigate("/", { replace: true });

    } catch (error) {
      console.error(
        "Registration/Login error:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="wl-auth-page">
      <section className="wl-auth-visual">
        <div className="wl-auth-visual-content">
          <span className="wl-auth-eyebrow">
            FASHION WITH A SECOND LIFE
          </span>

          <h1>
            Your style.
            <br />
            Your story.
            <br />
            <em>New beginnings.</em>
          </h1>

          <p>
            Join a community that believes great fashion
            deserves to be worn, shared, and loved again.
          </p>

          <div className="wl-auth-visual-footer">
            <span>Wear it. Swap it. Love it again.</span>
            <span>02 — 02</span>
          </div>
        </div>
      </section>

      <section className="wl-auth-form-section">
        <div className="wl-auth-form-wrap">
          <Link to="/" className="wl-auth-brand">
            Wear<span>Loop.</span>
          </Link>

          <div className="wl-auth-heading">
            <span className="wl-auth-label">JOIN WEARLOOP</span>
            <h2>Create your account</h2>
            <p>
              Start discovering fashion and exchanging
              pieces you love.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="wl-auth-form">
            <div className="wl-auth-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="wl-auth-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="wl-auth-field">
              <label htmlFor="register-password">Password</label>

              <div className="wl-auth-password-wrap">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  minLength={6}
                  required
                  disabled={loading}
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  className="wl-auth-show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <span className="wl-auth-hint">
                Use at least 6 characters.
              </span>
            </div>

            <div className="wl-auth-field">
              <label htmlFor="register-location">
                Location <span className="wl-auth-optional">(Optional)</span>
              </label>

              <input
                id="register-location"
                type="text"
                name="location"
                placeholder="City or area"
                value={formData.location}
                onChange={handleChange}
                disabled={loading}
                autoComplete="address-level2"
              />
            </div>

            <button
              type="submit"
              className="wl-auth-submit"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
              {!loading && <span>→</span>}
            </button>

            {message && (
              <p
                className={`wl-auth-message ${
                  message.toLowerCase().includes("failed") ||
                  message.toLowerCase().includes("missing")
                    ? "error"
                    : "success"
                }`}
                role="status"
              >
                {message}
              </p>
            )}
          </form>

          <div className="wl-auth-switch">
            Already have an account?
            <Link to="/login"> Sign in</Link>
          </div>

          <p className="wl-auth-bottom">
            Join the movement towards more thoughtful fashion.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;
