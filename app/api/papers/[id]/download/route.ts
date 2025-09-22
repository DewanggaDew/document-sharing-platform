import { NextResponse } from "next/server"
import { getAdminDb, getAdminStorageBucket } from "@/lib/firebase/admin"
import { requireAuth } from "@/lib/server/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || undefined
    const decoded = await requireAuth(authHeader)
    const userId = decoded.uid
    const db = getAdminDb()

    // Gate: require at least 1 upload
    const userSnap = await db.collection("users").doc(userId).get()
    const uploadsCount = (userSnap.exists ? (userSnap.data()?.uploadsCount as number) || 0 : 0)
    if (uploadsCount < 1) {
      return NextResponse.json({ error: "Upload a paper to access downloads" }, { status: 403 })
    }

    // Get paper
    const doc = await db.collection("papers").doc(params.id).get()
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const data = doc.data()!
    if (data.status !== "active") {
      return NextResponse.json({ error: "Unavailable" }, { status: 403 })
    }

    const storagePath = data.storagePath as string
    const bucket = getAdminStorageBucket()
    const file = bucket.file(storagePath)

    // Signed URL (1 hour)
    const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 })

    // Increment downloads
    await db.collection("papers").doc(params.id).update({ downloads: (data.downloads || 0) + 1, updatedAt: new Date() })

    return NextResponse.json({ url })
  } catch (err: any) {
    console.error("/api/papers/[id]/download error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
