import { NextResponse } from "next/server"
import { unstable_noStore as noStore } from "next/cache"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DEFAULT_LIMIT = 10

type MatchRow = { paper_id: string; similarity: number }

export async function POST(req: Request) {
  try {
    noStore()
    const body = await req.json().catch(() => null)
    if (!body || typeof body.query !== "string" || !body.query.trim()) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 })
    }

    const limit = Number.isFinite(body.limit) ? Math.min(Math.max(1, body.limit), 25) : DEFAULT_LIMIT

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || ""
    if (!apiKey) return NextResponse.json({ error: "Missing GOOGLE_GEMINI_API_KEY" }, { status: 500 })

    const genAI = new GoogleGenerativeAI(apiKey)
    const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
    const embeddingRes = await embedModel.embedContent(body.query)
    const vec = (embeddingRes as any)?.embedding?.values as number[] | undefined
    if (!vec || !Array.isArray(vec)) return NextResponse.json({ error: "Embedding failed" }, { status: 500 })

    const supabase = getSupabaseServer()
    const { data, error } = await supabase.rpc("match_papers_semantic", {
      query_embedding: vec as any,
      match_count: limit,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const matches = (data || []) as Array<MatchRow>
    let items: any[] = []
    if (matches.length) {
      const ids = matches.map((m) => m.paper_id)
      const { data: papers, error: papersErr } = await supabase
        .from("papers")
        .select("*")
        .in("id", ids)
      if (papersErr) return NextResponse.json({ error: papersErr.message }, { status: 500 })
      const byId = new Map(papers.map((p: any) => [p.id, p]))
      items = matches
        .map((m) => ({ paper: byId.get(m.paper_id), similarity: m.similarity }))
        .filter((x) => x.paper)
        .map(({ paper, similarity }) => ({
          id: paper.id,
          similarity,
          title: paper.title,
          description: paper.description,
          category: paper.category,
          competition: paper.competition,
          year: paper.year,
          university: paper.university,
          topics: paper.topics ?? [],
          companies: paper.companies ?? [],
          downloads: Number(paper.downloads ?? 0),
          views: Number(paper.views ?? 0),
        }))
    }

    return NextResponse.json({ query: body.query, total: items.length, items })
  } catch (err: any) {
    console.error("/api/search/semantic error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}


