import { getAdminAuthInstance } from "@/lib/firebase/admin"

export async function requireAuth(authorizationHeader?: string) {
  if (!authorizationHeader) {
    throw new Error("Missing Authorization header")
  }
  const [scheme, token] = authorizationHeader.split(" ")
  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid Authorization header format. Expected 'Bearer <token>'")
  }

  const adminAuth = getAdminAuthInstance()
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded
}

export type DecodedToken = Awaited<ReturnType<typeof requireAuth>>