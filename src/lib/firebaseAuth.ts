import type { Auth, GithubAuthProvider } from "firebase/auth";
import { getFirebaseApp } from "./firebaseApp";

let authPromise: Promise<{ auth: Auth; githubProvider: GithubAuthProvider }> | null = null;

export function getFirebaseAuth(): Promise<{ auth: Auth; githubProvider: GithubAuthProvider }> {
  if (!authPromise) {
    authPromise = Promise.all([getFirebaseApp(), import("firebase/auth")]).then(
      ([app, { getAuth, GithubAuthProvider }]) => ({
        auth: getAuth(app),
        githubProvider: new GithubAuthProvider(),
      })
    );
  }
  return authPromise;
}
