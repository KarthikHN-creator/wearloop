
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import API from "../services/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const currentToken = localStorage.getItem("token");
    setToken(currentToken);

    if (!currentToken) {
      setUser(null);
      return;
    }

    const loadUser = async () => {
      try {
        const response = await API.get("/users/profile");
        const profile = response.data.user || response.data;

        const updatedUser = {
          id: profile.id || profile._id,
          name: profile.name,
          email: profile.email,
          location: profile.location,
          role: profile.role,
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Profile fetch error:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken(null);
          setUser(null);
        }
      }
    };

    loadUser();
  }, [location.pathname]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);

    closeMenu();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `wl-nav-link${isActive ? " active" : ""}`;

  return (
    <header className="wl-navbar">
      <div className="wl-navbar-inner">
        <NavLink to="/" className="wl-brand" onClick={closeMenu}>
          <span className="wl-brand-mark">W</span>
          <span className="wl-brand-name">
            Wear<span>Loop</span>
            <small>FASHION, REIMAGINED</small>
          </span>
        </NavLink>

        <button
          type="button"
          className="wl-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={`wl-nav-links ${menuOpen ? "wl-nav-open" : ""}`}>
          <NavLink to="/" end className={linkClass} onClick={closeMenu}>
            Discover
          </NavLink>

          {token ? (
            <>
              <NavLink
                to="/marketplace"
                className={linkClass}
                onClick={closeMenu}
              >
                Marketplace
              </NavLink>

              <NavLink
                to="/dashboard"
                className={linkClass}
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>

              <NavLink to="/swaps" className={linkClass} onClick={closeMenu}>
                My Swaps
              </NavLink>

              <NavLink
                to="/my-clothing"
                className={linkClass}
                onClick={closeMenu}
              >
                My Wardrobe
              </NavLink>

              <NavLink
                to="/swap-calculator"
                className={linkClass}
                onClick={closeMenu}
              >
                Swap Value
              </NavLink>

              <div className="wl-notification">
                <NotificationBell />
              </div>

              {user?.role === "admin" && (
                <NavLink to="/admin" className={linkClass} onClick={closeMenu}>
                  Admin
                </NavLink>
              )}

              <NavLink
                to="/profile"
                className="wl-profile-link"
                onClick={closeMenu}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </NavLink>

              <button
                type="button"
                className="wl-login-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={closeMenu}>
                Log in
              </NavLink>

              <NavLink
                to="/register"
                className="wl-register-button"
                onClick={closeMenu}
              >
                Join WearLoop
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
