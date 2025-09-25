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

  const direct = tryParseJson(raw)
  if (direct) return direct

  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8")
    const b64 = tryParseJson(decoded)
    if (b64) return b64
  } catch {}

  try {
    if (fs.existsSync(raw)) {
      const fileContents = fs.readFileSync(raw, "utf8")
      const fromFile = tryParseJson(fileContents)
      if (fromFile) return fromFile
    }
  } catch {}

  return null
}

function initAdmin(): AdminApp {
  if (!getApps().length) {
    const serviceAccount = loadServiceAccount()
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (serviceAccount) {
      adminApp = initializeApp({
        credential: cert(serviceAccount as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId,
      })
    } else {
      adminApp = initializeApp({
        credential: applicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId,
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
  return getAdminStorage(initAdmin()).bucket()
}

export type { AdminFirestore }