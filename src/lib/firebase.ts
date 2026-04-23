import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBxwD9tNC6DiOwedRjdtp3BDBAHkY6D1Lk",
  authDomain: "gs-interview-prep.firebaseapp.com",
  projectId: "gs-interview-prep",
  storageBucket: "gs-interview-prep.firebasestorage.app",
  messagingSenderId: "256030842919",
  appId: "1:256030842919:web:69bb00dd2178e32591ae02",
  measurementId: "G-HBEBBNR870"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
