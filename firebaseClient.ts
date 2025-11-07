
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDwf9xBQ1oYmGZzzVLc2Il0On13l2hJ8K8",
  authDomain: "brh-apps-k6hhgf.firebaseapp.com",
  databaseURL: "https://brh-apps-k6hhgf-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "brh-apps-k6hhgf",
  storageBucket: "brh-apps-k6hhgf.appspot.com",
  messagingSenderId: "742011825010",
  appId: "1:742011825010:web:4e3da3cc03032b1bae8beb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
