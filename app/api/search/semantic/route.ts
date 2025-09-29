import { NextResponse } from "next/server"
import { unstable_noStore as noStore } from "next/cache"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getSupabaseServer } from "@/lib/supabase/server"
import { normalizeVector } from "@/lib/embeddings/normalize"

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
    const embedWithRetry = async () => {
      const attempts = 3
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          return await embedModel.embedContent(body.query)
        } catch (err: any) {
          const status = err?.status || err?.statusCode
          const retriable = status === 500 || status === 502 || status === 503 || status === 504
          console.warn(
            `/api/search/semantic embedding attempt ${attempt} failed (status=${status ?? "n/a"})`,
            err
          )
          if (!retriable || attempt === attempts) throw err
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
        }
      }
    }

    let embeddingRes: any
    try {
      embeddingRes = await embedWithRetry()
    } catch (err: any) {
      const status = err?.status || err?.statusCode
      const message = err?.message || "Embedding call failed"
      console.error("/api/search/semantic embedding final failure", message)
      if (status === 500 || status === 502 || status === 503 || status === 504) {
        return NextResponse.json(
          { error: "Semantic search is temporarily unavailable. Please try again shortly." },
          { status: 503 }
        )
      }
      throw err
    }
    const vec = (embeddingRes as any)?.embedding?.values as number[] | undefined
    if (!vec || !Array.isArray(vec)) {
      console.warn("/api/search/semantic embedding returned empty vector", embeddingRes)
      return NextResponse.json({ error: "Embedding failed" }, { status: 500 })
    }

    const normalizedVec = normalizeVector(vec)

    const supabase = getSupabaseServer()
    const { data, error } = await supabase.rpc("match_papers_semantic", {
      query_embedding: normalizedVec as any,
      match_count: limit,
    })

    if (error) {
      console.error("/api/search/semantic match_papers_semantic error", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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


