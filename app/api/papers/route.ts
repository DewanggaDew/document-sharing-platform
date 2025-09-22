import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.toLowerCase().trim()
    const category = searchParams.get("category")
    const year = searchParams.get("year")
    const competition = searchParams.get("competition")
    const university = searchParams.get("university")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100)
    const cursorB64 = searchParams.get("cursor")

    const db = getAdminDb()

    // Base query
    let query: FirebaseFirestore.Query = db
      .collection("papers")
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")

    // Apply cursor if present (createdAt based)
    if (cursorB64) {
      try {
        const { createdAt } = JSON.parse(Buffer.from(cursorB64, "base64").toString("utf8")) as {
          createdAt: string
          id?: string
        }
        if (createdAt) {
          query = query.startAfter(new Date(createdAt))
        }
      } catch {
        // ignore malformed cursor
      }
    }

    // Fetch a page window; we purposely fetch slightly over requested limit
    const fetchLimit = Math.min(limit + 20, 200)
    const snap = await query.limit(fetchLimit).get()
    let docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))

    // In-memory filters for MVP
    if (category) docs = docs.filter((d) => d.category === category)
    if (year) docs = docs.filter((d) => String(d.year) === String(year))
    if (competition) docs = docs.filter((d) => d.competition?.toLowerCase().includes(competition.toLowerCase()))
    if (university) docs = docs.filter((d) => d.university?.toLowerCase().includes(university.toLowerCase()))
    if (q) {
      docs = docs.filter((d) => {
        const hay = `${d.title} ${d.description} ${d.category} ${d.competition} ${d.university} ${(d.topics || []).join(" ")} ${(d.companies || []).join(" ")}`.toLowerCase()
        return hay.includes(q)
      })
    }

    const items = docs.slice(0, limit)
    const last = items[items.length - 1]
    const nextCursor = docs.length > limit && last?.createdAt
      ? Buffer.from(JSON.stringify({ createdAt: (last.createdAt as FirebaseFirestore.Timestamp | Date) instanceof Date ? (last.createdAt as Date).toISOString() : new Date((last.createdAt as any)?._seconds ? (last.createdAt as any)._seconds * 1000 : Date.now()).toISOString() })).toString("base64")
      : null

    return NextResponse.json({ items, nextCursor })
  } catch (err: any) {
    console.error("/api/papers error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
