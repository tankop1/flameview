import React, { useState } from "react";
import firebaseLogo from "../assets/Firebase Logo.png";

const Home = () => {
  const [selectedProject, setSelectedProject] = useState("Plotline");
  const [selectedMode, setSelectedMode] = useState("Read only");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const projects = [
    "Plotline",
    "Shortwave",
    "AnotherProject",
    "Mylestones",
    "Project5",
  ];

  const modes = ["Read only", "Read & write"];

  const handleProjectSelect = (projectName) => {
    setSelectedProject(projectName);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
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

        {/* Project Tags */}
        <div className="project-tags-wrapper">
          <div className="project-tags">
            {projects.map((project) =>
              selectedProject === project ? (
                <div key={project} className="project-tag-outer selected">
                  <div className="project-tag-inner">
                    <img
                      src={firebaseLogo}
                      alt="Firebase Logo"
                      className="tag-logo"
                    />
                    <span>{project}</span>
                  </div>
                </div>
              ) : (
                <div
                  key={project}
                  className="project-tag"
                  onClick={() => handleProjectSelect(project)}
                >
                  <img
                    src={firebaseLogo}
                    alt="Firebase Logo"
                    className="tag-logo"
                  />
                  <span>{project}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Input Interface */}
        <div className="input-section">
          <div className="input-container">
            <textarea
              className="chat-input"
              placeholder="Ask anything..."
              rows="4"
            />
            <div className="input-controls">
              <div
                className={`dropdown-container ${isDropdownOpen ? "open" : ""}`}
              >
                <button className="mode-selector" onClick={toggleDropdown}>
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
              <button className="send-btn">
                <span className="send-arrow">↑</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
