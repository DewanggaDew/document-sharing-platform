import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

// Ensure env vars are available on client via NEXT_PUBLIC_ prefix
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseApp() called on the server; use Admin SDK instead")
  }
  if (!getApps().length) {
    if (!firebaseConfig.apiKey) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY")
    app = initializeApp(firebaseConfig)
  } else {
    app = getApps()[0]!
  }
  return app
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp())
  return auth
}

export function getFirestoreDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp())
  return db
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getFirebaseApp())
  return storage
}

export type { FirebaseApp }