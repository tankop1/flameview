// Dashboard service for saving and loading dashboards

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Save dashboard to Firestore
export const saveDashboard = async (userId, projectId, dashboardData) => {
  try {
    const dashboardId = `dashboard_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const dashboardDoc = {
      id: dashboardId,
      userId,
      projectId,
      code: dashboardData.code,
      dataRequirements: dashboardData.dataRequirements || {},
      messages: dashboardData.messages || [],
      data: dashboardData.data || {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      title: dashboardData.title || "Untitled Dashboard",
      description: dashboardData.description || "",
    };

    const dashboardRef = doc(db, "dashboards", dashboardId);
    await setDoc(dashboardRef, dashboardDoc);

    console.log("Dashboard saved successfully:", dashboardId);
    return dashboardId;
  } catch (error) {
    console.error("Error saving dashboard:", error);
    throw error;
  }
};

// Get dashboard by ID
export const getDashboard = async (dashboardId) => {
  try {
    const dashboardRef = doc(db, "dashboards", dashboardId);
    const dashboardSnap = await getDoc(dashboardRef);

    if (dashboardSnap.exists()) {
      return dashboardSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting dashboard:", error);
    throw error;
  }
};

// Update existing dashboard
export const updateDashboard = async (dashboardId, updates) => {
  try {
    const dashboardRef = doc(db, "dashboards", dashboardId);

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(dashboardRef, updateData);

    console.log("Dashboard updated successfully:", dashboardId);
    return true;
  } catch (error) {
    console.error("Error updating dashboard:", error);
    throw error;
  }
};

// Get all dashboards for a user and project
export const getUserDashboards = async (userId, projectId) => {
  try {
    const dashboardsRef = collection(db, "dashboards");
    const q = query(
      dashboardsRef,
      where("userId", "==", userId),
      where("projectId", "==", projectId)
    );

    const querySnapshot = await getDocs(q);
    const dashboards = [];

    querySnapshot.forEach((doc) => {
      dashboards.push(doc.data());
    });

    // Sort by updatedAt descending
    dashboards.sort((a, b) => {
      if (a.updatedAt && b.updatedAt) {
        return b.updatedAt.toDate() - a.updatedAt.toDate();
      }
      return 0;
    });

    return dashboards;
  } catch (error) {
    console.error("Error getting user dashboards:", error);
    return [];
  }
};

// Delete dashboard
export const deleteDashboard = async (dashboardId) => {
  try {
    const dashboardRef = doc(db, "dashboards", dashboardId);
    await updateDoc(dashboardRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
    });

    console.log("Dashboard deleted successfully:", dashboardId);
    return true;
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    throw error;
  }
};

// Add message to dashboard conversation
export const addMessageToDashboard = async (
  dashboardId,
  userMessage,
  aiResponse
) => {
  try {
    const dashboard = await getDashboard(dashboardId);
    if (!dashboard) {
      throw new Error("Dashboard not found");
    }

    const newMessage = {
      id: Date.now(),
      userMessage,
      aiResponse,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...(dashboard.messages || []), newMessage];

    await updateDashboard(dashboardId, {
      messages: updatedMessages,
    });

    return updatedMessages;
  } catch (error) {
    console.error("Error adding message to dashboard:", error);
    throw error;
  }
};

// Update dashboard code and data
export const updateDashboardCode = async (
  dashboardId,
  code,
  data,
  dataRequirements
) => {
  try {
    await updateDashboard(dashboardId, {
      code,
      data,
      dataRequirements,
      lastGenerated: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error updating dashboard code:", error);
    throw error;
  }
};
