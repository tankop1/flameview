import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

// Get user document from Firestore
export const getUserDocument = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user document:", error);
    throw error;
  }
};

// Save Firebase connection data to user document
export const saveFirebaseConnection = async (
  uid,
  oauthToken,
  refreshToken,
  projects
) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    const firebaseConnection = {
      oauthToken,
      refreshToken,
      projects,
      connectedAt: serverTimestamp(),
    };

    if (userDocSnap.exists()) {
      // Update existing document
      await updateDoc(userDocRef, {
        firebaseConnection,
      });
    } else {
      // Create new document
      await setDoc(userDocRef, {
        email: "", // Will be set by auth context
        createdAt: serverTimestamp(),
        firebaseConnection,
        serviceAccounts: {},
      });
    }

    return true;
  } catch (error) {
    console.error("Error saving Firebase connection:", error);
    throw error;
  }
};

// Save service account key for a specific project
export const saveServiceAccount = async (
  uid,
  projectId,
  serviceAccountJson
) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      throw new Error("User document not found");
    }

    const userData = userDocSnap.data();
    const serviceAccounts = userData.serviceAccounts || {};

    serviceAccounts[projectId] = {
      ...serviceAccountJson,
      uploadedAt: serverTimestamp(),
    };

    await updateDoc(userDocRef, {
      serviceAccounts,
    });

    return true;
  } catch (error) {
    console.error("Error saving service account:", error);
    throw error;
  }
};

// Get service account for a specific project
export const getServiceAccount = async (uid, projectId) => {
  try {
    const userDoc = await getUserDocument(uid);

    if (!userDoc || !userDoc.serviceAccounts) {
      return null;
    }

    return userDoc.serviceAccounts[projectId] || null;
  } catch (error) {
    console.error("Error getting service account:", error);
    throw error;
  }
};

// Check if user has Firebase connection
export const hasFirebaseConnection = async (uid) => {
  try {
    const userDoc = await getUserDocument(uid);
    return (
      userDoc &&
      userDoc.firebaseConnection &&
      userDoc.firebaseConnection.projects
    );
  } catch (error) {
    console.error("Error checking Firebase connection:", error);
    return false;
  }
};

// Get user's Firebase projects
export const getUserFirebaseProjects = async (uid) => {
  try {
    const userDoc = await getUserDocument(uid);

    if (!userDoc || !userDoc.firebaseConnection) {
      return [];
    }

    return userDoc.firebaseConnection.projects || [];
  } catch (error) {
    console.error("Error getting Firebase projects:", error);
    return [];
  }
};
