import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/auth"
import { getAdminDb } from "@/lib/firebase/admin"
import { createFlagSchema } from "@/lib/validators/flags"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || undefined
    const decoded = await requireAuth(authHeader)
    const userId = decoded.uid

    const body = await req.json().catch(() => ({}))
    const parsed = createFlagSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
    }
    const { paperId, reason } = parsed.data

    const db = getAdminDb()
    const flagsRef = db.collection("flags").doc()
    const now = new Date()
    await flagsRef.set({
      paperId,
      userId,
      reason,
      status: "open",
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ id: flagsRef.id })
  } catch (err: any) {
    console.error("/api/flags POST error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
