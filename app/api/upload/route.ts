import { NextResponse } from "next/server"
import { getAdminDb, getAdminStorageBucket } from "@/lib/firebase/admin"
import { requireAuth } from "@/lib/server/auth"
import { uploadMetadataSchema } from "@/lib/validators/upload"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || undefined
    const decoded = await requireAuth(authHeader)
    const userId = decoded.uid

    // Parse multipart form-data
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const metadataPart = formData.get("metadata") as any

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 })
    }
    if (!metadataPart) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
    }

    // Extract metadata as text (handles both string and File/Blob cases)
    let metadataRaw = ""
    if (typeof metadataPart === "string") {
      metadataRaw = metadataPart
    } else if (typeof metadataPart?.text === "function") {
      metadataRaw = await metadataPart.text()
    } else {
      return NextResponse.json({ error: "Invalid metadata format" }, { status: 400 })
    }

    // Validate size and type (server-side)
    const allowedTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ])

    const contentTypeCandidate = file.type || "application/octet-stream"
    if (contentTypeCandidate && !allowedTypes.has(contentTypeCandidate)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const maxBytes = 50 * 1024 * 1024 // 50MB
    if (bytes.length > maxBytes) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
    }

    // Parse and validate metadata JSON
    let metadataJson: any
    try {
      metadataJson = JSON.parse(metadataRaw)
    } catch {
      return NextResponse.json({ error: "Invalid metadata JSON" }, { status: 400 })
    }
    const parsed = uploadMetadataSchema.safeParse(metadataJson)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid metadata", details: parsed.error.flatten() }, { status: 400 })
    }
    const meta = parsed.data

    // Upload to Firebase Storage
    const bucket = getAdminStorageBucket()
    const now = Date.now()
    const ext = (file.name.split(".").pop() || "").toLowerCase()
    const storagePath = `papers/${userId}/${now}-${Math.random().toString(36).slice(2)}.${ext}`
    const contentType = contentTypeCandidate

    await bucket.file(storagePath).save(bytes, {
      contentType,
      resumable: false,
      metadata: {
        metadata: {
          uploadedBy: userId,
          originalName: file.name,
        },
      },
    })

    // Firestore doc
    const db = getAdminDb()
    const papersRef = db.collection("papers")
    const docRef = papersRef.doc() // auto-id
    const paperDoc = {
      title: meta.title,
      category: meta.category,
      competition: meta.competition,
      year: typeof meta.year === "string" ? parseInt(meta.year, 10) : meta.year,
      university: meta.university,
      team: meta.team ?? null,
      description: meta.description ?? "",
      topics: meta.topics ?? [],
      companies: meta.companies ?? [],
      authorUserId: userId,
      storagePath,
      fileType: contentType,
      fileSize: bytes.length,
      views: 0,
      downloads: 0,
      likes: 0,
      verified: false,
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await docRef.set(paperDoc)

    // Increment uploadsCount on user profile
    const userRef = db.collection("users").doc(userId)
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef)
      const uploadsCount = (snap.exists ? (snap.data()?.uploadsCount as number) || 0 : 0) + 1
      tx.set(
        userRef,
        {
          uploadsCount,
          updatedAt: new Date(),
        },
        { merge: true },
      )
    })

    return NextResponse.json({ paperId: docRef.id, storagePath })
  } catch (err: any) {
    console.error("/api/upload error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
