import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";
import googleLogo from "../assets/Google Logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User successfully signed in
      navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Failed to sign in. Please check your credentials.";

      // Handle specific Firebase auth errors
      switch (err.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email address.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          errorMessage = err.message || "Failed to sign in. Please try again.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await signInWithPopup(auth, googleProvider);
      // User successfully signed in with Google
      navigate("/");
    } catch (err) {
      console.error("Google login error:", err);
      let errorMessage = "Failed to sign in with Google.";

      // Handle specific Google auth errors
      switch (err.code) {
        case "auth/popup-closed-by-user":
          errorMessage = "Sign-in popup was closed. Please try again.";
          break;
        case "auth/popup-blocked":
          errorMessage =
            "Sign-in popup was blocked. Please allow popups and try again.";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "Sign-in was cancelled. Please try again.";
          break;
        case "auth/account-exists-with-different-credential":
          errorMessage =
            "An account already exists with this email using a different sign-in method.";
          break;
        default:
          errorMessage =
            err.message || "Failed to sign in with Google. Please try again.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="main-content">
        {/* Hero Text */}
        <div className="hero-section">
          <h2 className="hero-title">
            Login to <span className="firebase-highlight">FlameView</span>
          </h2>
        </div>

        {/* Login Form */}
        <div className="login-form-container">
          <form className="login-form" onSubmit={handleEmailLogin}>
            <div className="form-group">
              <input
                type="email"
                className="form-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input password-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="login-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="divider">
            <span>or</span>
          </div>

          <button
            className="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <img src={googleLogo} alt="Google" className="google-logo" />
            Continue with Google
          </button>

          <div className="signup-link">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="link">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
