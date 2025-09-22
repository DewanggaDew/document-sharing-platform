import { cert, getApps, initializeApp, type App as AdminApp, applicationDefault } from "firebase-admin/app"
import { getAuth as getAdminAuth, type Auth as AdminAuth } from "firebase-admin/auth"
import { getFirestore as getAdminFirestore, type Firestore as AdminFirestore } from "firebase-admin/firestore"
import { getStorage as getAdminStorage } from "firebase-admin/storage"
import fs from "node:fs"

let adminApp: AdminApp

function tryParseJson(input: string): any | null {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

function loadServiceAccount(): any | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!raw) return null

  // 1) Try direct JSON
  const direct = tryParseJson(raw)
  if (direct) return direct

  // 2) Try base64-encoded JSON
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8")
    const b64 = tryParseJson(decoded)
    if (b64) return b64
  } catch {
    // ignore
  }

  // 3) Treat as file path containing JSON
  try {
    if (fs.existsSync(raw)) {
      const fileContents = fs.readFileSync(raw, "utf8")
      const fromFile = tryParseJson(fileContents)
      if (fromFile) return fromFile
    }
  } catch {
    // ignore
  }

  return null
}

function initAdmin(): AdminApp {
  if (!getApps().length) {
    const serviceAccount = loadServiceAccount()
    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    } else {
      // Fallback to ADC (e.g., GOOGLE_APPLICATION_CREDENTIALS)
      adminApp = initializeApp({
        credential: applicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      })
    }
  } else {
    adminApp = getApps()[0]!
  }
  return adminApp
}

export function getAdminDb(): AdminFirestore {
  return getAdminFirestore(initAdmin())
}

export function getAdminAuthInstance(): AdminAuth {
  return getAdminAuth(initAdmin())
}

export function getAdminStorageBucket() {
  // Returns a Bucket instance
  return getAdminStorage(initAdmin()).bucket()
}

export type { AdminFirestore }