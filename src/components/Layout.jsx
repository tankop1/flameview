import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import firebaseLogo from "../assets/Firebase Logo.png";

const Layout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-section">
          <img
            src={firebaseLogo}
            alt="Firebase Logo"
            className="firebase-logo"
          />
          <h1 className="logo-text">FlameView</h1>
        </Link>
        <div className="header-buttons">
          {user ? (
            <>
              <span className="user-email">{user.email}</span>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className="signup-btn">
                Sign Up
              </Link>
              <Link to="/login" className="login-btn">
                Login
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-layout">{children}</main>
    </div>
  );
};

export default Layout;
