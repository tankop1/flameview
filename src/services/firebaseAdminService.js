// Firebase Admin service for accessing user's Firebase projects with service account

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  limit,
  where,
  orderBy,
} from "firebase/firestore";

// Initialize Firebase app with user's service account
export const initializeUserFirebase = (serviceAccount) => {
  try {
    const userFirebaseConfig = {
      apiKey: serviceAccount.api_key || serviceAccount.client_email,
      authDomain: `${serviceAccount.project_id}.firebaseapp.com`,
      projectId: serviceAccount.project_id,
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
      messagingSenderId: serviceAccount.client_id,
      appId: `1:${serviceAccount.client_id}:web:${serviceAccount.private_key_id}`,
    };

    const userApp = initializeApp(
      userFirebaseConfig,
      `user-${serviceAccount.project_id}`
    );
    const userDb = getFirestore(userApp);

    return { app: userApp, db: userDb };
  } catch (error) {
    console.error("Error initializing user Firebase:", error);
    throw new Error("Failed to initialize Firebase with service account");
  }
};

// Get Firestore schema by listing all collections and sampling documents
export const getFirestoreSchema = async (userDb) => {
  try {
    // Note: Firestore doesn't have a direct way to list collections from client-side
    // We'll need to use a different approach - either server-side or known collections
    // For now, we'll return a mock schema structure that can be populated
    // In a real implementation, you'd need server-side code or use Firebase Admin SDK

    console.log("Getting Firestore schema...");

    // This is a placeholder - in practice, you'd need server-side code to list collections
    // or maintain a known list of collections for each project
    return {
      // This would be populated by server-side code that lists collections
      // For now, we'll return an empty object and let the AI request specific collections
    };
  } catch (error) {
    console.error("Error getting Firestore schema:", error);
    return {};
  }
};

// Fetch data from a specific collection
export const fetchCollectionData = async (
  userDb,
  collectionPath,
  filters = {},
  limitCount = 1000
) => {
  try {
    console.log(`Fetching data from collection: ${collectionPath}`);

    const collectionRef = collection(userDb, collectionPath);
    let q = query(collectionRef, limit(limitCount));

    // Apply filters if provided
    if (filters.orderBy) {
      q = query(
        q,
        orderBy(filters.orderBy.field, filters.orderBy.direction || "asc")
      );
    }

    if (filters.where) {
      Object.entries(filters.where).forEach(([field, value]) => {
        q = query(q, where(field, "==", value));
      });
    }

    const snapshot = await getDocs(q);
    const documents = [];

    snapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`Fetched ${documents.length} documents from ${collectionPath}`);
    return documents;
  } catch (error) {
    console.error(
      `Error fetching data from collection ${collectionPath}:`,
      error
    );
    throw error;
  }
};

// Fetch multiple collections based on requirements
export const fetchRequiredData = async (userDb, dataRequirements) => {
  try {
    const {
      collections = [],
      filters = {},
      limit: limitCount = 1000,
    } = dataRequirements;
    const fetchedData = {};

    for (const collectionName of collections) {
      try {
        const collectionFilters = filters[collectionName] || {};
        const data = await fetchCollectionData(
          userDb,
          collectionName,
          collectionFilters,
          limitCount
        );
        fetchedData[collectionName] = data;
      } catch (error) {
        console.error(`Failed to fetch collection ${collectionName}:`, error);
        fetchedData[collectionName] = [];
      }
    }

    return fetchedData;
  } catch (error) {
    console.error("Error fetching required data:", error);
    throw error;
  }
};

// Get sample documents from all available collections (for schema discovery)
export const discoverCollections = async (userDb, knownCollections = []) => {
  try {
    const discoveredData = {};

    // If we have known collections, sample from them
    for (const collectionName of knownCollections) {
      try {
        const sampleData = await fetchCollectionData(
          userDb,
          collectionName,
          {},
          5
        );
        if (sampleData.length > 0) {
          discoveredData[collectionName] = {
            sampleDocuments: sampleData,
            documentCount: sampleData.length,
            fields: getFieldTypes(sampleData),
          };
        }
      } catch (error) {
        console.log(
          `Collection ${collectionName} not accessible or doesn't exist`
        );
      }
    }

    return discoveredData;
  } catch (error) {
    console.error("Error discovering collections:", error);
    return {};
  }
};

// Analyze field types from sample documents
const getFieldTypes = (documents) => {
  if (!documents || documents.length === 0) return {};

  const fieldTypes = {};

  documents.forEach((doc) => {
    Object.entries(doc).forEach(([key, value]) => {
      if (key === "id") return; // Skip document ID

      const valueType = typeof value;
      if (!fieldTypes[key]) {
        fieldTypes[key] = new Set();
      }
      fieldTypes[key].add(valueType);
    });
  });

  // Convert sets to arrays
  const result = {};
  Object.entries(fieldTypes).forEach(([key, types]) => {
    result[key] = Array.from(types);
  });

  return result;
};
