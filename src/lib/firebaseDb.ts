import type { Firestore } from "firebase/firestore";
import { databaseId, hasConfig } from "./firebaseConfig";
import { getFirebaseApp } from "./firebaseApp";

let dbPromise: Promise<Firestore | null> | null = null;

export function getFirebaseDb(): Promise<Firestore | null> {
  if (!hasConfig) return Promise.resolve(null);
  if (!dbPromise) {
    dbPromise = Promise.all([getFirebaseApp(), import("firebase/firestore")])
      .then(([app, { getFirestore }]) =>
        databaseId && databaseId !== "(default)" ? getFirestore(app, databaseId) : getFirestore(app)
      )
      .catch(() => null);
  }
  return dbPromise;
}
