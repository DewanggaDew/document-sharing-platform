import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

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
    const sort = (searchParams.get("sort") || "recent").toLowerCase()
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100)
    const cursorB64 = searchParams.get("cursor")

    const supabase = getSupabaseServer()

    // Build base query
    let query = supabase
      .from("papers")
      .select("*")
      .eq("status", "active")
    // Sorting
    if (sort === "downloads") {
      query = query.order("downloads", { ascending: false }).order("created_at", { ascending: false })
    } else if (sort === "views") {
      query = query.order("views", { ascending: false }).order("created_at", { ascending: false })
    } else if (sort === "likes") {
      query = query.order("likes", { ascending: false }).order("created_at", { ascending: false })
    } else {
      // recent/default
      query = query.order("created_at", { ascending: false })
    }

    // Server-side filters where simple
    if (category) query = query.eq("category", category)
    if (year) query = query.eq("year", Number(year))
    if (competition) query = query.ilike("competition", `%${competition}%`)
    if (university) query = query.ilike("university", `%${university}%`)

    // Cursor (created_at based)
    if (cursorB64) {
      try {
        const { created_at } = JSON.parse(Buffer.from(cursorB64, "base64").toString("utf8")) as {
          created_at: string
        }
        if (created_at) {
          query = query.lt("created_at", created_at)
        }
      } catch {
        // ignore malformed cursor
      }
    }

    const { data: rows, error } = await query.limit(limit + 1)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    let docs = (rows || []) as any[]

    // In-memory keyword filter for MVP
    if (q) {
      docs = docs.filter((d) => {
        const hay = `${d.title} ${d.description ?? ""} ${d.category} ${d.competition ?? ""} ${d.university ?? ""} ${(d.topics || []).join(" ")} ${(d.companies || []).join(" ")}`.toLowerCase()
        return hay.includes(q)
      })
    }

    const items = docs.slice(0, limit)
    const last = items[items.length - 1]
    const nextCursor = docs.length > limit && last?.created_at
      ? Buffer.from(JSON.stringify({ created_at: last.created_at })).toString("base64")
      : null

    return NextResponse.json({ items, nextCursor })
  } catch (err: any) {
    console.error("/api/papers error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
