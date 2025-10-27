import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase/config";
import { fetchFirebaseProjects } from "../services/firebaseProjectsService";
import { saveFirebaseConnection } from "../services/userService";
import firebaseLogo from "../assets/Firebase Logo.png";

const ConnectFirebase = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleGoogleConnect = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Create a custom Google provider with Firebase Management API scopes
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/firebase.readonly");
      provider.addScope(
        "https://www.googleapis.com/auth/cloud-platform.read-only"
      );

      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;

      console.log("OAuth result:", result);
      console.log("Credential:", credential);
      console.log("Access token:", accessToken?.substring(0, 20) + "...");

      if (!accessToken) {
        throw new Error("Failed to get access token");
      }

      // Fetch user's Firebase projects
      console.log("About to fetch Firebase projects...");
      const projects = await fetchFirebaseProjects(accessToken);
      console.log("Fetched projects:", projects);

      if (projects.length === 0) {
        throw new Error(
          "No Firebase projects found. Make sure you have access to at least one Firebase project."
        );
      }

      // Save connection data to Firestore
      await saveFirebaseConnection(
        user.uid,
        accessToken,
        credential.refreshToken || "",
        projects
      );

      // Navigate to home page
      navigate("/");
    } catch (err) {
      console.error("Firebase connection error:", err);
      let errorMessage = "Failed to connect to Firebase. Please try again.";

      switch (err.code) {
        case "auth/popup-closed-by-user":
          errorMessage = "Connection popup was closed. Please try again.";
          break;
        case "auth/popup-blocked":
          errorMessage =
            "Connection popup was blocked. Please allow popups and try again.";
          break;
        case "auth/cancelled-popup-request":
          errorMessage = "Connection was cancelled. Please try again.";
          break;
        default:
          errorMessage =
            err.message || "Failed to connect to Firebase. Please try again.";
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="connect-firebase-page">
      <main className="main-content">
        {/* Hero Text */}
        <div className="hero-section">
          <h2 className="hero-title">
            Connect your <span className="firebase-highlight">Firebase</span>{" "}
            account
          </h2>
          <p className="hero-subtitle">
            Access your Firebase projects and start building amazing dashboards
          </p>
        </div>

        {/* Connection Card */}
        <div className="connection-card">
          <div className="connection-header">
            <img
              src={firebaseLogo}
              alt="Firebase Logo"
              className="connection-logo"
            />
            <h3>Connect to Firebase</h3>
          </div>

          <p className="connection-description">
            We'll help you connect to your Firebase account so you can access
            all your projects and data.
          </p>

          {error && <div className="error-message">{error}</div>}

          <button
            className="connect-btn"
            onClick={handleGoogleConnect}
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Connect with Google"}
          </button>

          <div className="connection-info">
            <h4>What we'll access:</h4>
            <ul>
              <li>View your Firebase projects</li>
              <li>Read project information</li>
              <li>Access project data (with your permission)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConnectFirebase;
