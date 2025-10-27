// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrPTdxhW2eKuDfTvPFy2q4IDW2EYheUXs",
  authDomain: "flameviewai.firebaseapp.com",
  projectId: "flameviewai",
  storageBucket: "flameviewai.firebasestorage.app",
  messagingSenderId: "1091678338441",
  appId: "1:1091678338441:web:0b214954dd0ace2973f558",
  measurementId: "G-9SMNJGQZVS",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
