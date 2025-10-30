import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDLy_6UOn4GERksWMnTxIC1uq8JdJXAOTc",
  authDomain: "todo-app-cp-d3000.firebaseapp.com",
  projectId: "todo-app-cp-d3000",
  storageBucket: "todo-app-cp-d3000.firebasestorage.app",
  messagingSenderId: "649271171176",
  appId: "1:649271171176:web:f598269fd9aaa45f4703dd",
  measurementId: "G-LGXNDHBZFK"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);
