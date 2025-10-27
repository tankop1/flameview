import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const View = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState("Read only");
  const [inputValue, setInputValue] = useState("");
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const modes = ["Read only", "Read & write"];

  // Get query parameters from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");

    if (mode) {
      setSelectedMode(decodeURIComponent(mode));
    }
  }, [location.search]);

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // For now, just log the input - you can add actual functionality later
      console.log("User input:", inputValue);
      console.log("Selected mode:", selectedMode);
    }
  };

  const handleCollapseToggle = () => {
    setIsAIPanelCollapsed(!isAIPanelCollapsed);
  };

  return (
    <div className="view-page">
      {/* Main Content Area */}
      <main className="view-main-content">
        <div
          className={`view-content-panel ${
            isAIPanelCollapsed ? "expanded" : ""
          }`}
        >
          {/* This is the large dark gray panel from the screenshot */}
          <div className="view-panel-content">
            {/* Content area is now empty */}
          </div>
        </div>

        {/* Collapse button when panel is collapsed */}
        {isAIPanelCollapsed && (
          <button
            className="view-ai-icon-btn collapse-btn collapsed-button"
            title="Expand"
            onClick={handleCollapseToggle}
          >
            <span>+</span>
          </button>
        )}

        {/* AI Panel - Right Side */}
        <div
          className={`view-ai-panel ${isAIPanelCollapsed ? "collapsed" : ""}`}
        >
          {/* Icon buttons */}
          {!isAIPanelCollapsed && (
            <>
              <button
                className="view-ai-icon-btn collapse-btn"
                title="Collapse"
                onClick={handleCollapseToggle}
              >
                <span>−</span>
              </button>
              <div className="view-ai-header-right">
                <button className="view-ai-icon-btn help-btn" title="Help">
                  <span>?</span>
                </button>
                <button
                  className="view-ai-icon-btn settings-btn"
                  title="Settings"
                >
                  <span>⚙</span>
                </button>
              </div>
            </>
          )}

          {/* Spacer to push chatbot to bottom */}
          <div className="view-ai-spacer"></div>

          {/* Chatbot Input Box - Bottom Right */}
          <div className="view-chatbot-container">
            <form onSubmit={handleSubmit} className="view-chatbot-form">
              <textarea
                className="view-chatbot-input"
                placeholder="Ask or build anything..."
                value={inputValue}
                onChange={handleInputChange}
                rows="3"
              />
              <div className="view-chatbot-controls">
                <div
                  className={`view-dropdown-container ${
                    isDropdownOpen ? "open" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="view-mode-selector"
                    onClick={toggleDropdown}
                  >
                    <span>{selectedMode}</span>
                    <span className="view-chevron">▼</span>
                  </button>
                  {isDropdownOpen && (
                    <div className="view-dropdown-menu">
                      {modes.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          className={`view-dropdown-option ${
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
                <button type="submit" className="view-send-btn">
                  <span className="view-send-arrow">↑</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default View;
