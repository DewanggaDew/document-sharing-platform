import { getFirebaseAuth } from "@/lib/firebase/client"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"

function getAuthInstance() {
  // Only initialize in the browser
  if (typeof window === "undefined") {
    // Return a proxy that throws if used server-side
    throw new Error("Auth is not available on the server")
  }
  return getFirebaseAuth()
}

export function onAuthChanged(cb: (user: User | null) => void) {
  const auth = getAuthInstance()
  return onAuthStateChanged(auth, cb)
}

export async function emailSignIn(email: string, password: string) {
  const auth = getAuthInstance()
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

export async function emailSignUp(name: string, email: string, password: string) {
  const auth = getAuthInstance()
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  if (name) await updateProfile(cred.user, { displayName: name })
  return cred.user
}

export async function googleSignIn() {
  const auth = getAuthInstance()
  const provider = new GoogleAuthProvider()
  const cred = await signInWithPopup(auth, provider)
  return cred.user
}

export async function signOut() {
  const auth = getAuthInstance()
  await fbSignOut(auth)
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getAuthInstance()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken(forceRefresh)
}
