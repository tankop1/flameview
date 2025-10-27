// Firebase Management API service for fetching user's Firebase projects

const FIREBASE_MANAGEMENT_API_BASE = "https://firebase.googleapis.com/v1beta1";
const GOOGLE_CLOUD_API_BASE = "https://cloudresourcemanager.googleapis.com/v1";

// Exchange OAuth code for access token (this would typically be done server-side)
// For now, we'll use the access token directly from Google OAuth
export const fetchFirebaseProjects = async (accessToken) => {
  try {
    console.log(
      "Fetching Firebase projects with token:",
      accessToken?.substring(0, 20) + "..."
    );

    // Try Firebase Management API first
    let response = await fetch(`${FIREBASE_MANAGEMENT_API_BASE}/projects`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Firebase API Response status:", response.status);
    console.log(
      "Firebase API Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Firebase API Error response:", errorText);

      // If Firebase API fails, try Google Cloud Resource Manager API
      console.log("Trying Google Cloud Resource Manager API as fallback...");
      response = await fetch(`${GOOGLE_CLOUD_API_BASE}/projects`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Google Cloud API Response status:", response.status);

      if (!response.ok) {
        const cloudErrorText = await response.text();
        console.error("Google Cloud API Error response:", cloudErrorText);
        throw new Error(
          `Both APIs failed. Firebase: ${response.status} - ${errorText}, Google Cloud: ${response.status} - ${cloudErrorText}`
        );
      }
    }

    const data = await response.json();
    console.log("API Response data:", data);

    // Parse and format project data - Firebase API returns 'results' not 'projects'
    const projects = data.results || data.projects || [];
    console.log("Found projects:", projects);

    // Debug: Log the first project to see its structure
    if (projects.length > 0) {
      console.log("First project structure:", projects[0]);
      console.log("Available keys in first project:", Object.keys(projects[0]));
    }

    const formattedProjects = projects
      .map((project) => {
        console.log("Processing project:", project);
        return {
          projectId: project.projectId,
          displayName: project.displayName || project.projectId,
          projectNumber: project.projectNumber,
          state: project.state || "ACTIVE",
        };
      })
      .filter((project) => {
        console.log("Filtering project:", project, "State:", project.state);
        return project.state === "ACTIVE";
      });

    console.log("Formatted active projects:", formattedProjects);
    return formattedProjects;
  } catch (error) {
    console.error("Error fetching Firebase projects:", error);
    throw error;
  }
};

// Validate service account JSON
export const validateServiceAccount = (serviceAccountJson) => {
  try {
    const requiredFields = [
      "type",
      "project_id",
      "private_key_id",
      "private_key",
      "client_email",
      "client_id",
      "auth_uri",
      "token_uri",
    ];

    for (const field of requiredFields) {
      if (!serviceAccountJson[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (serviceAccountJson.type !== "service_account") {
      throw new Error("Invalid service account type");
    }

    return true;
  } catch (error) {
    console.error("Service account validation error:", error);
    throw error;
  }
};

// Test service account connection (basic validation)
export const testServiceAccountConnection = async (serviceAccountJson) => {
  try {
    // Basic validation of the service account structure
    validateServiceAccount(serviceAccountJson);

    // Additional checks could be added here, such as:
    // - Testing actual Firebase connection
    // - Verifying project access
    // - Checking permissions

    return {
      valid: true,
      projectId: serviceAccountJson.project_id,
      clientEmail: serviceAccountJson.client_email,
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
};
