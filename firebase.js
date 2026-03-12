import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ╔══════════════════════════════════════════════════╗
// ║   🔑 APNI FIREBASE CONFIG YAHAN PASTE KARO      ║
// ║   Firebase Console > Project Settings > Config   ║
// ╚══════════════════════════════════════════════════╝

const firebaseConfig = {
  apiKey:            "AIzaSyASJpgAH577g2X2QS4NsTteoBdC-jzGM5A",
  authDomain:        "roz-kamao-pk.firebaseapp.com",
  projectId:         "roz-kamao-pk",
  storageBucket:     "roz-kamao-pk.firebasestorage.app",
  messagingSenderId: "663362493055",
  appId:             "1:663362493055:web:57415cf30c58c0526dbd4a",
};

// ╔══════════════════════════════════════════════════╗
// ║   ⬆️ SIRF UPAR KI 6 LINES BADALNI HAIN          ║
// ╚══════════════════════════════════════════════════╝

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
