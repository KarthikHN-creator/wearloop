
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email,
        password,
      });

      console.log("Login response:", response.data);

      localStorage.setItem("token", response.data.token);

      const user = {
        id: response.data.id,
        name: response.data.name,
        email: response.data.email,
        location: response.data.location,
        role: response.data.role,
      };

      localStorage.setItem("user", JSON.stringify(user));

      console.log("Logged in user:", user);

      setMessage("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      console.error(
        "Login error:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message || "Login failed"
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
            A MORE CONSCIOUS WAY TO DRESS
          </span>

          <h1>
            Good clothes
            <br />
            deserve <em>another</em>
            <br />
            story.
          </h1>

          <p>
            Discover pre-loved fashion, exchange styles,
            and give great clothing a new beginning.
          </p>

          <div className="wl-auth-visual-footer">
            <span>Wear it. Swap it. Love it again.</span>
            <span>01 — 02</span>
          </div>
        </div>
      </section>

      <section className="wl-auth-form-section">
        <div className="wl-auth-form-wrap">
          <Link to="/" className="wl-auth-brand">
            Wear<span>Loop.</span>
          </Link>

          <div className="wl-auth-heading">
            <span className="wl-auth-label">WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Your next favourite outfit might be one swap away.
            </p>
          </div>

          <form onSubmit={handleLogin} className="wl-auth-form">
            <div className="wl-auth-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="wl-auth-field">
              <div className="wl-auth-password-label">
                <label htmlFor="login-password">Password</label>
              </div>

              <div className="wl-auth-password-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
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
            </div>

            <button
              type="submit"
              className="wl-auth-submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <span>→</span>}
            </button>

            {message && (
              <p
                className={`wl-auth-message ${
                  message === "Login successful!" ? "success" : "error"
                }`}
                role="status"
              >
                {message}
              </p>
            )}
          </form>

          <div className="wl-auth-switch">
            Don't have an account?
            <Link to="/register"> Create an account</Link>
          </div>

          <p className="wl-auth-bottom">
            By continuing, you agree to use WearLoop responsibly.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;
