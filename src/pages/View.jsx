import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getServiceAccount } from "../services/userService";
import {
  initializeUserFirebase,
  discoverCollections,
  fetchRequiredData,
} from "../services/firebaseAdminService";
import {
  sendMessageToGemini,
  analyzeDataRequirements,
} from "../services/geminiService";
import {
  saveDashboard,
  updateDashboard,
  addMessageToDashboard,
} from "../services/dashboardService";
import DynamicDashboard from "../components/DynamicDashboard";
import LoadingAnimation from "../components/LoadingAnimation";

const View = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState("Read only");
  const [inputValue, setInputValue] = useState("");
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [currentProjectId, setCurrentProjectId] = useState("");
  const [dashboardCode, setDashboardCode] = useState("");
  const [dashboardData, setDashboardData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [dashboardId, setDashboardId] = useState(null);
  const [firestoreSchema, setFirestoreSchema] = useState({});
  const [userFirebase, setUserFirebase] = useState(null);
  const [initialUserInput, setInitialUserInput] = useState("");
  const [hasSentInitialInput, setHasSentInitialInput] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const modes = ["Read only", "Read & write"];

  // Get query parameters from URL
  useEffect(() => {
    console.log("URL search params:", location.search);
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    const projectName = searchParams.get("project");
    const projectId = searchParams.get("projectId");
    const initialInput = searchParams.get("input");

    console.log(
      "Parsed params - mode:",
      mode,
      "projectName:",
      projectName,
      "projectId:",
      projectId
    );

    if (mode) {
      setSelectedMode(decodeURIComponent(mode));
    }
    if (projectName) {
      setProjectName(decodeURIComponent(projectName));
    }
    if (projectId) {
      setCurrentProjectId(decodeURIComponent(projectId));
    }
    if (initialInput) {
      setInitialUserInput(decodeURIComponent(initialInput));
    }
  }, [location.search]);

  // Initialize user's Firebase connection
  useEffect(() => {
    const initializeFirebase = async () => {
      console.log("Firebase init - user:", user);
      console.log("Firebase init - currentProjectId:", currentProjectId);

      if (!user || !currentProjectId || currentProjectId.trim() === "") {
        console.log("Skipping Firebase init - missing user or projectId");
        return;
      }

      try {
        console.log("Getting service account...");
        const serviceAccount = await getServiceAccount(
          user.uid,
          currentProjectId
        );
        console.log("Service account:", serviceAccount);

        if (serviceAccount) {
          console.log("Initializing user Firebase...");
          const firebase = initializeUserFirebase(serviceAccount);
          setUserFirebase(firebase);

          // Discover collections and build schema
          console.log("Discovering collections...");
          const collections = await discoverCollections(firebase.db, []);
          console.log("Discovered collections:", collections);
          setFirestoreSchema(collections);
        } else {
          console.log("No service account found");
        }
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };

    initializeFirebase();
  }, [user, currentProjectId]);

  // If an initial input was provided via URL, auto-send it once
  useEffect(() => {
    // Send as soon as Firebase is initialized; don't block on schema discovery
    const ready =
      user &&
      currentProjectId &&
      currentProjectId.trim() !== "" &&
      userFirebase;
    if (!hasSentInitialInput && initialUserInput && ready && !isLoading) {
      // Directly send the initial message
      sendUserMessage(initialUserInput);
      setHasSentInitialInput(true);
    }
  }, [
    hasSentInitialInput,
    initialUserInput,
    user,
    currentProjectId,
    userFirebase,
    isLoading,
  ]);

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

  // Reusable message sender used by submit and initial input
  const sendUserMessage = async (userMessage) => {
    if (!userMessage || !userMessage.trim() || isLoading) return;
    userMessage = userMessage.trim();
    const messageId = Date.now();

    // Add user message to chat
    const userMessageObj = {
      id: messageId,
      text: userMessage,
      mode: selectedMode,
      timestamp: new Date(),
      type: "user",
    };
    setMessages((prevMessages) => [...prevMessages, userMessageObj]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Analyze what data we need
      const dataRequirements = await analyzeDataRequirements(
        userMessage,
        firestoreSchema
      );

      // Fetch the required data
      let fetchedData = {};
      console.log("Data requirements:", dataRequirements);
      console.log("User Firebase:", userFirebase);
      console.log("Collections length:", dataRequirements.collections?.length);
      console.log("Collections array:", dataRequirements.collections);

      if (userFirebase && dataRequirements.collections.length > 0) {
        console.log("Fetching data...");
        fetchedData = await fetchRequiredData(
          userFirebase.db,
          dataRequirements
        );
        console.log("Fetched data result:", fetchedData);
      } else {
        console.log(
          "Skipping data fetch - userFirebase:",
          !!userFirebase,
          "collections length:",
          dataRequirements.collections?.length
        );
      }

      // Send message to Gemini
      const aiResponse = await sendMessageToGemini(
        userMessage,
        conversationHistory,
        firestoreSchema,
        dashboardCode || null
      );

      if (aiResponse.success) {
        // Add AI response to chat
        const aiMessageObj = {
          id: messageId + 1,
          text: aiResponse.fullResponse,
          timestamp: new Date(),
          type: "ai",
        };
        setMessages((prevMessages) => [...prevMessages, aiMessageObj]);

        // Update conversation history
        const newConversationEntry = {
          userMessage,
          aiResponse: aiResponse.fullResponse,
        };
        setConversationHistory((prev) => [...prev, newConversationEntry]);

        // Update dashboard code and data
        console.log("AI Response success:", aiResponse.success);
        console.log("Setting dashboard code:", aiResponse.code);
        console.log("Setting dashboard data:", fetchedData);
        console.log("Data requirements:", dataRequirements);
        setDashboardCode(aiResponse.code);
        setDashboardData(fetchedData);

        // Save or update dashboard
        if (dashboardId) {
          await updateDashboard(dashboardId, {
            code: aiResponse.code,
            data: fetchedData,
            dataRequirements,
          });
          await addMessageToDashboard(
            dashboardId,
            userMessage,
            aiResponse.fullResponse
          );
        } else {
          const newDashboardId = await saveDashboard(
            user.uid,
            currentProjectId,
            {
              code: aiResponse.code,
              data: fetchedData,
              dataRequirements,
              messages: [...conversationHistory, newConversationEntry],
              title: `Dashboard for ${projectName}`,
              description: userMessage,
            }
          );
          setDashboardId(newDashboardId);
        }
      } else {
        // Add error message to chat
        const errorMessageObj = {
          id: messageId + 1,
          text: `Error: ${aiResponse.error}`,
          timestamp: new Date(),
          type: "error",
        };
        setMessages((prevMessages) => [...prevMessages, errorMessageObj]);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessageObj = {
        id: messageId + 1,
        text: `Error: ${error.message}`,
        timestamp: new Date(),
        type: "error",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendUserMessage(inputValue);
  };

  const handleCollapseToggle = () => {
    setIsAIPanelCollapsed(!isAIPanelCollapsed);
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  return (
    <div className="view-page">
      {/* Project Name Header */}
      {projectName && (
        <div className="view-project-header">
          <span className="view-project-name">&gt; {projectName}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="view-main-content">
        <div
          className={`view-content-panel ${
            isAIPanelCollapsed ? "expanded" : ""
          }`}
        >
          {/* Dashboard Content */}
          <div className="view-panel-content">
            <DynamicDashboard
              code={dashboardCode}
              data={dashboardData}
              isLoading={isLoading}
            />
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

          {/* Messages Area */}
          <div className="view-messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`view-message ${message.type || "user"}`}
              >
                <div className="view-message-content">
                  <div className="view-message-text">{message.text}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <LoadingAnimation message="Generating dashboard..." />
            )}
            <div ref={messagesEndRef} />
          </div>

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
