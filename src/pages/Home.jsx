import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  getUserFirebaseProjects,
  getServiceAccount,
  saveServiceAccount,
} from "../services/userService";
import {
  validateServiceAccount,
  testServiceAccountConnection,
} from "../services/firebaseProjectsService";
import firebaseLogo from "../assets/Firebase Logo.png";

const Home = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedMode, setSelectedMode] = useState("Read only");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasServiceAccount, setHasServiceAccount] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const modes = ["Read only", "Read & write"];

  // Fetch user's Firebase projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const userProjects = await getUserFirebaseProjects(user.uid);
        setProjects(userProjects);

        // Set first project as selected if available
        if (userProjects.length > 0) {
          setSelectedProject(userProjects[0]);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  // Check if selected project has service account
  useEffect(() => {
    const checkServiceAccount = async () => {
      if (!user || !selectedProject) {
        setHasServiceAccount(false);
        return;
      }

      try {
        const serviceAccount = await getServiceAccount(
          user.uid,
          selectedProject.projectId
        );
        setHasServiceAccount(!!serviceAccount);
      } catch (error) {
        console.error("Error checking service account:", error);
        setHasServiceAccount(false);
      }
    };

    checkServiceAccount();
  }, [user, selectedProject]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle file upload
  const handleFileUpload = async (file) => {
    if (!file || file.type !== "application/json") {
      setUploadError("Please select a valid JSON file.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const text = await file.text();
      const serviceAccountJson = JSON.parse(text);

      // Validate service account
      validateServiceAccount(serviceAccountJson);

      // Test connection
      const testResult = await testServiceAccountConnection(serviceAccountJson);
      if (!testResult.valid) {
        throw new Error(testResult.error);
      }

      // Save service account
      await saveServiceAccount(
        user.uid,
        selectedProject.projectId,
        serviceAccountJson
      );

      // Update state
      setHasServiceAccount(true);
      setUploadError("");
    } catch (error) {
      console.error("Service account upload error:", error);
      setUploadError(
        error.message || "Failed to upload service account. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Open file input
  const openFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle "Try it for free" button click
  const handleTryFreeClick = () => {
    navigate("/signup");
  };

  // Handle chat input change
  const handleChatInputChange = (e) => {
    setChatInput(e.target.value);
  };

  // Handle send button click
  const handleSendClick = () => {
    if (chatInput.trim()) {
      // Navigate to View page with the input as a query parameter
      const projectName = selectedProject ? selectedProject.displayName : "";
      navigate(
        `/view?input=${encodeURIComponent(chatInput)}&mode=${encodeURIComponent(
          selectedMode
        )}&project=${encodeURIComponent(projectName)}`
      );
    }
  };

  // Handle Enter key press in textarea
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <div className="home-page">
      {/* Main Content */}
      <main className="main-content">
        {/* Hero Text */}
        <div className="hero-section">
          <h2 className="hero-title">
            Transform <span className="firebase-highlight">Firebase</span> data
            into
            <br />
            functional dashboards in seconds
          </h2>
        </div>

        {/* Show "Try it for free" button if no user is logged in */}
        {!user ? (
          <div className="cta-section">
            <button className="try-free-btn" onClick={handleTryFreeClick}>
              Try it for free
            </button>
          </div>
        ) : (
          <>
            {/* Project Tags */}
            <div className="project-tags-wrapper">
              {isLoading ? (
                <div className="loading-projects">
                  Loading your Firebase projects...
                </div>
              ) : projects.length > 0 ? (
                <div className="project-tags">
                  {projects.map((project) =>
                    selectedProject &&
                    selectedProject.projectId === project.projectId ? (
                      <div
                        key={project.projectId}
                        className="project-tag-outer selected"
                      >
                        <div className="project-tag-inner">
                          <img
                            src={firebaseLogo}
                            alt="Firebase Logo"
                            className="tag-logo"
                          />
                          <span>{project.displayName}</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={project.projectId}
                        className="project-tag"
                        onClick={() => handleProjectSelect(project)}
                      >
                        <img
                          src={firebaseLogo}
                          alt="Firebase Logo"
                          className="tag-logo"
                        />
                        <span>{project.displayName}</span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="firebase-not-connected">
                  <div className="not-connected-content">
                    <img
                      src={firebaseLogo}
                      alt="Firebase Logo"
                      className="not-connected-logo"
                    />
                    <span>Firebase not connected</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Interface */}
            <div className="input-section">
              {selectedProject && !hasServiceAccount ? (
                <div className="service-account-upload">
                  <div
                    className={`upload-area ${isDragOver ? "drag-over" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="upload-content">
                      <img
                        src={firebaseLogo}
                        alt="Firebase Logo"
                        className="upload-logo"
                      />
                      <h3>
                        Connect Data Access for {selectedProject.displayName}
                      </h3>
                      <p>
                        To use the chatbot with this project, upload your
                        Firebase service account key.
                      </p>

                      <div className="upload-instructions">
                        <h4>How to get your service account key:</h4>
                        <ol>
                          <li>
                            Go to{" "}
                            <a
                              href="https://console.firebase.google.com"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Firebase Console
                            </a>
                          </li>
                          <li>
                            Select your project:{" "}
                            <strong>{selectedProject.displayName}</strong>
                          </li>
                          <li>Go to Project Settings → Service Accounts</li>
                          <li>Click "Generate new private key"</li>
                          <li>Download the JSON file</li>
                          <li>Upload it here or drag and drop</li>
                        </ol>
                      </div>

                      {uploadError && (
                        <div className="upload-error">{uploadError}</div>
                      )}

                      <button
                        className="upload-btn"
                        onClick={openFileInput}
                        disabled={isUploading}
                      >
                        {isUploading
                          ? "Uploading..."
                          : "Upload Service Account Key"}
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileInputChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                </div>
              ) : selectedProject && hasServiceAccount ? (
                <div className="input-container">
                  <textarea
                    className="chat-input"
                    placeholder="Describe the view you want to create..."
                    rows="4"
                    value={chatInput}
                    onChange={handleChatInputChange}
                    onKeyPress={handleKeyPress}
                  />
                  <div className="input-controls">
                    <div
                      className={`dropdown-container ${
                        isDropdownOpen ? "open" : ""
                      }`}
                    >
                      <button
                        className="mode-selector"
                        onClick={toggleDropdown}
                      >
                        <span>{selectedMode}</span>
                        <span className="chevron">▼</span>
                      </button>
                      {isDropdownOpen && (
                        <div className="dropdown-menu">
                          {modes.map((mode) => (
                            <button
                              key={mode}
                              className={`dropdown-option ${
                                selectedMode === mode ? "selected" : ""
                              }`}
                              onClick={() => handleModeSelect(mode)}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="send-btn" onClick={handleSendClick}>
                      <span className="send-arrow">↑</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="no-project-selected">
                  <p>
                    Select a Firebase project to get started with the chatbot.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
