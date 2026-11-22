import type { FirebaseApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";

let appPromise: Promise<FirebaseApp> | null = null;

export function getFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = import("firebase/app").then(({ initializeApp, getApps, getApp }) =>
      getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
    );
  }
  return appPromise;
}
