import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const db = getAdminDb()
    const ref = db.collection("papers").doc(params.id)
    const doc = await ref.get()
    if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Increment views atomically
    await ref.update({ views: (doc.data()?.views || 0) + 1, updatedAt: new Date() })
    const updated = await ref.get()
    const data = updated.data()!
    return NextResponse.json({ id: updated.id, ...data })
  } catch (err: any) {
    console.error("/api/papers/[id] error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
