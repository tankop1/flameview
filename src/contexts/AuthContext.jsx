import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  hasFirebaseConnection,
  getUserFirebaseProjects,
} from "../services/userService";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasFirebase, setHasFirebase] = useState(false);
  const [firebaseProjects, setFirebaseProjects] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Check Firebase connection status
        try {
          const hasConnection = await hasFirebaseConnection(user.uid);
          setHasFirebase(hasConnection);

          if (hasConnection) {
            const projects = await getUserFirebaseProjects(user.uid);
            setFirebaseProjects(projects);
          } else {
            setFirebaseProjects([]);
          }
        } catch (error) {
          console.error("Error checking Firebase connection:", error);
          setHasFirebase(false);
          setFirebaseProjects([]);
        }
      } else {
        setHasFirebase(false);
        setFirebaseProjects([]);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshFirebaseData = async () => {
    if (!user) return;

    try {
      const hasConnection = await hasFirebaseConnection(user.uid);
      setHasFirebase(hasConnection);

      if (hasConnection) {
        const projects = await getUserFirebaseProjects(user.uid);
        setFirebaseProjects(projects);
      } else {
        setFirebaseProjects([]);
      }
    } catch (error) {
      console.error("Error refreshing Firebase data:", error);
    }
  };

  const value = {
    user,
    logout,
    loading,
    hasFirebase,
    firebaseProjects,
    refreshFirebaseData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
