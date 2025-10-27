import React, { useState, useEffect, useMemo } from "react";
import { transform } from "@babel/standalone";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts";

// Transform JSX to JavaScript using Babel
const transformJSXToJavaScript = (code) => {
  try {
    const result = transform(code, {
      presets: ["react"],
      plugins: [],
    });
    return result.code;
  } catch (error) {
    console.error("Babel transformation error:", error);
    throw new Error(`JSX transformation failed: ${error.message}`);
  }
};

// Error boundary for catching rendering errors
class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Dashboard rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dashboard-error">
          <h3>Dashboard Error</h3>
          <p>There was an error rendering the dashboard:</p>
          <pre>{this.state.error?.message || "Unknown error"}</pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe component renderer
const DynamicDashboard = ({ code, data, isLoading }) => {
  const [renderedComponent, setRenderedComponent] = useState(null);
  const [error, setError] = useState(null);

  // Memoize the component creation to avoid re-rendering on every data change
  const componentCode = useMemo(() => {
    console.log("useMemo triggered - DynamicDashboard received code:", code);
    console.log("useMemo triggered - DynamicDashboard received data:", data);

    if (!code) {
      console.log("No code provided, returning null");
      return null;
    }

    let cleanedCode = ""; // Declare outside try block for error handling

    try {
      // Basic security check - ensure it's not trying to access dangerous globals
      if (
        code.includes("eval") ||
        code.includes("Function") ||
        code.includes("setTimeout") ||
        code.includes("setInterval")
      ) {
        throw new Error("Code contains potentially dangerous operations");
      }

      // Clean the code by removing import statements and export statements
      cleanedCode = code
        // Remove all types of import statements
        .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, "") // Remove default imports
        .replace(/import\s+{[\s\S]*?}\s+from\s+['"][^'"]*['"];?\s*/g, "") // Remove named imports
        .replace(/import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]*['"];?\s*/g, "") // Remove namespace imports
        .replace(/import\s+['"][^'"]*['"];?\s*/g, "") // Remove side-effect imports
        // Remove export statements
        .replace(/export\s+default\s+/g, "") // Remove export default
        .replace(/export\s+{[\s\S]*?};?\s*/g, "") // Remove named exports
        .replace(/export\s+.*?;?\s*/g, "") // Remove other exports
        // Clean up extra whitespace
        .replace(/\n\s*\n\s*\n/g, "\n\n") // Remove excessive newlines
        .trim();

      // Transform JSX to JavaScript using Babel
      console.log("Before Babel transformation:", cleanedCode);
      cleanedCode = transformJSXToJavaScript(cleanedCode);
      console.log("After Babel transformation:", cleanedCode);

      // The code should already be a complete function after Babel transformation
      // No need to wrap it further - Babel handles JSX transformation
      console.log("Final cleaned code:", cleanedCode);

      // Create a safe environment with all the dependencies
      const safeEnvironment = {
        React,
        useState,
        useEffect,
        useMemo,
        BarChart,
        Bar,
        XAxis,
        YAxis,
        CartesianGrid,
        Tooltip,
        ResponsiveContainer,
        LineChart,
        Line,
        PieChart,
        Pie,
        Cell,
        AreaChart,
        Area,
        ScatterChart,
        Scatter,
      };

      // Create the component function - the cleanedCode should already be a complete function
      const componentFunction = new Function(
        ...Object.keys(safeEnvironment),
        `
        ${cleanedCode}
        return Dashboard;
        `
      );

      const component = componentFunction(...Object.values(safeEnvironment));

      console.log("Successfully created component:", component);
      return component;
    } catch (err) {
      console.error("Error creating component:", err);
      console.error("Original code:", code);
      console.error("Cleaned code:", cleanedCode);
      console.error("Code length:", code?.length);
      console.error("Cleaned code length:", cleanedCode?.length);
      setError(`Code generation error: ${err.message}`);
      return null;
    }
  }, [code]);

  useEffect(() => {
    console.log("useEffect triggered - componentCode:", componentCode);
    if (componentCode) {
      console.log("Setting renderedComponent");
      setRenderedComponent(() => componentCode);
      setError(null);
    } else {
      console.log("No componentCode available");
    }
  }, [componentCode]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <h3>Code Error</h3>
        <p>There was an error in the generated code:</p>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="dashboard-empty">
        <div className="empty-state">
          <h3>No Dashboard</h3>
          <p>Send a message to generate your first dashboard!</p>
        </div>
      </div>
    );
  }

  // Debug: Show what we're working with
  console.log("DynamicDashboard render - code:", code);
  console.log("DynamicDashboard render - data:", data);
  console.log("DynamicDashboard render - isLoading:", isLoading);

  if (!renderedComponent) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Preparing dashboard...</p>
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            background: "#333",
            borderRadius: "8px",
          }}
        >
          <p>Debug info:</p>
          <p>Code length: {code?.length || 0}</p>
          <p>Data keys: {data ? Object.keys(data).join(", ") : "none"}</p>
        </div>
      </div>
    );
  }

  console.log("About to render - renderedComponent:", renderedComponent);
  console.log("About to render - data:", data);

  return (
    <DashboardErrorBoundary>
      <div className="dynamic-dashboard">
        {React.createElement(renderedComponent, { data })}
      </div>
    </DashboardErrorBoundary>
  );
};

export default DynamicDashboard;
