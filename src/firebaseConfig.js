import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAS07wTNcSLqEVAXQc_6kgqQP9BPGCKIjM",
  authDomain: "sin-project-9ce12.firebaseapp.com",
  projectId: "sin-project-9ce12",
  storageBucket: "sin-project-9ce12.firebasestorage.app",
  messagingSenderId: "261120131163",
  appId: "1:261120131163:web:efe78b8b28fe61a255bf7e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
