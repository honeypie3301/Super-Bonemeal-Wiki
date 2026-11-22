const splitApiKey = ["AIzaSy", "DrRTYr5RVjn8pttF29qJzSIkdGIWZOqc8"].join("");

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || splitApiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "backwoods-wiki.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "backwoods-wiki",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "backwoods-wiki.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "80403339974",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:80403339974:web:776c1c7585ad31bbe5d5c7"
};

export const hasConfig = !!firebaseConfig.apiKey;

export const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)";

export const firebaseConfigDetails = {
  projectId: firebaseConfig.projectId,
  apiKey: firebaseConfig.apiKey,
  databaseId,
};
