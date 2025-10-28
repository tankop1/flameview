const express = require("express");
const admin = require("firebase-admin");
const {
  verifyAuthToken,
  checkProjectAccess,
} = require("../middleware/authMiddleware");
const {
  initializeAdminApp,
  discoverAllCollections,
  fetchCollectionsData,
  getUserServiceAccount,
} = require("../services/firebaseAdminService");

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyAuthToken);

// Helper to get or initialize the FlameView Admin app once
const getFlameViewAdminApp = () => {
  const appName = "flameview-admin";
  // Prefer checking via admin.app(name) which throws if not initialized
  try {
    return admin.app(appName);
  } catch (_) {
    // Not initialized yet; initialize it now
    try {
      return admin.initializeApp(
        {
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FIREBASE_PROJECT_ID,
        },
        appName
      );
    } catch (e) {
      // In rare races, another init may have succeeded; try returning existing again
      return admin.app(appName);
    }
  }
};

/**
 * POST /api/data/discover-schema
 * Discover all collections and build comprehensive schema
 */
router.post("/discover-schema", async (req, res) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Project ID is required",
      });
    }

    console.log(
      `🔍 Discovering schema for project: ${projectId} (user: ${req.user.uid})`
    );

    // Initialize or reuse FlameView's admin app for user data access
    const flameViewApp = getFlameViewAdminApp();

    const flameViewDb = admin.firestore(flameViewApp);

    // Get user's service account for the target project
    const serviceAccount = await getUserServiceAccount(
      flameViewDb,
      req.user.uid,
      projectId
    );

    if (!serviceAccount) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Service account not found for this project",
      });
    }

    // Initialize admin app with user's service account
    const { db: userAdminDb } = initializeAdminApp(serviceAccount, projectId);

    // Discover all collections
    const schema = await discoverAllCollections(userAdminDb);

    console.log(
      `✅ Schema discovery complete for ${projectId}: ${
        Object.keys(schema).length
      } collections`
    );

    res.json({
      success: true,
      data: {
        projectId,
        schema,
        discoveredAt: new Date().toISOString(),
        totalCollections: Object.keys(schema).length,
      },
    });
  } catch (error) {
    console.error("❌ Schema discovery error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

/**
 * POST /api/data/fetch-collections
 * Fetch data from specified collections with filters
 */
router.post("/fetch-collections", async (req, res) => {
  try {
    const { projectId, collections, filters = {}, limit = 1000 } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Project ID is required",
      });
    }

    if (
      !collections ||
      !Array.isArray(collections) ||
      collections.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Collections array is required and must not be empty",
      });
    }

    console.log(
      `📥 Fetching data for project: ${projectId} (user: ${req.user.uid})`
    );
    console.log(`📊 Collections: ${collections.join(", ")}`);

    // Initialize or reuse FlameView's admin app for user data access
    const flameViewApp = getFlameViewAdminApp();

    const flameViewDb = admin.firestore(flameViewApp);

    // Get user's service account for the target project
    const serviceAccount = await getUserServiceAccount(
      flameViewDb,
      req.user.uid,
      projectId
    );

    if (!serviceAccount) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Service account not found for this project",
      });
    }

    // Initialize admin app with user's service account
    const { db: userAdminDb } = initializeAdminApp(serviceAccount, projectId);

    // Fetch data from collections
    const data = await fetchCollectionsData(
      userAdminDb,
      collections,
      filters,
      limit
    );

    console.log(
      `✅ Data fetch complete for ${projectId}: ${
        Object.keys(data).length
      } collections`
    );

    res.json({
      success: true,
      data: {
        projectId,
        collections: data,
        fetchedAt: new Date().toISOString(),
        totalCollections: Object.keys(data).length,
        totalDocuments: Object.values(data).reduce(
          (sum, docs) => sum + docs.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error("❌ Data fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

/**
 * POST /api/data/refresh
 * Refresh data for existing dashboard using stored requirements
 */
router.post("/refresh", async (req, res) => {
  try {
    const { projectId, dataRequirements } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Project ID is required",
      });
    }

    if (!dataRequirements || !dataRequirements.collections) {
      return res.status(400).json({
        success: false,
        error: "Bad Request",
        message: "Data requirements with collections are required",
      });
    }

    console.log(
      `🔄 Refreshing data for project: ${projectId} (user: ${req.user.uid})`
    );

    // Initialize or reuse FlameView's admin app for user data access
    const flameViewApp = getFlameViewAdminApp();

    const flameViewDb = admin.firestore(flameViewApp);

    // Get user's service account for the target project
    const serviceAccount = await getUserServiceAccount(
      flameViewDb,
      req.user.uid,
      projectId
    );

    if (!serviceAccount) {
      return res.status(404).json({
        success: false,
        error: "Not Found",
        message: "Service account not found for this project",
      });
    }

    // Initialize admin app with user's service account
    const { db: userAdminDb } = initializeAdminApp(serviceAccount, projectId);

    // Fetch data using stored requirements
    const data = await fetchCollectionsData(
      userAdminDb,
      dataRequirements.collections,
      dataRequirements.filters || {},
      dataRequirements.limit || 1000
    );

    console.log(
      `✅ Data refresh complete for ${projectId}: ${
        Object.keys(data).length
      } collections`
    );

    res.json({
      success: true,
      data: {
        projectId,
        collections: data,
        refreshedAt: new Date().toISOString(),
        totalCollections: Object.keys(data).length,
        totalDocuments: Object.values(data).reduce(
          (sum, docs) => sum + docs.length,
          0
        ),
      },
    });
  } catch (error) {
    console.error("❌ Data refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: error.message,
    });
  }
});

/**
 * GET /api/data/health
 * Health check for data routes
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Data routes are healthy",
    timestamp: new Date().toISOString(),
    user: req.user ? req.user.uid : "unknown",
  });
});

module.exports = router;
