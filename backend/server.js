const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dataRoutes = require("./routes/dataRoutes");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/data", dataRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Start server with graceful EADDRINUSE handling
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`🚀 Backend server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
    console.log(
      `🌐 CORS enabled for: ${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }`
    );
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.warn(`⚠️  Port ${port} in use. Retrying on port ${nextPort}...`);
      setTimeout(() => startServer(nextPort), 500);
    } else {
      console.error("❌ Server error:", err);
      process.exit(1);
    }
  });
};

startServer(PORT);

module.exports = app;
