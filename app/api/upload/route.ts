import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/auth"
import { uploadMetadataSchema } from "@/lib/validators/upload"
import { getSupabaseServer } from "@/lib/supabase/server"
import { normalizeVector } from "@/lib/embeddings/normalize"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

    let metadataRaw = ""
    if (typeof metadataPart === "string") metadataRaw = metadataPart
    else if (typeof metadataPart?.text === "function") metadataRaw = await metadataPart.text()
    else return NextResponse.json({ error: "Invalid metadata format" }, { status: 400 })

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
    const maxBytes = 50 * 1024 * 1024
    if (bytes.length > maxBytes) {
      return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 })
    }

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

    // Supabase upload
    const supabase = getSupabaseServer()
    const now = Date.now()
    const ext = (file.name.split(".").pop() || "").toLowerCase()
    const path = `${userId}/${now}-${Math.random().toString(36).slice(2)}.${ext}`

    // Ensure bucket exists (papers) - best effort
    await supabase.storage.createBucket("papers", { public: false }).catch(() => {})

    const { error: uploadErr } = await supabase.storage.from("papers").upload(path, bytes, {
      contentType: contentTypeCandidate,
      upsert: false,
    })
    if (uploadErr) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 })
    }

    // Insert DB row
    const insert = {
      title: meta.title,
      category: meta.category,
      competition: meta.competition,
      year: typeof meta.year === "string" ? parseInt(meta.year, 10) : meta.year,
      university: meta.university,
      team: meta.team ?? null,
      description: meta.description ?? null,
      topics: (meta.topics ?? []) as string[],
      companies: (meta.companies ?? []) as string[],
      author_user_id: userId,
      storage_path: path,
      file_type: contentTypeCandidate,
      file_size: bytes.length,
      views: 0,
      downloads: 0,
      likes: 0,
      verified: false,
      status: "active",
    }
    const { data, error: dbErr } = await supabase.from("papers").insert(insert).select("id").single()
    if (dbErr) {
      return NextResponse.json({ error: `DB insert failed: ${dbErr.message}` }, { status: 500 })
    }

    // Best-effort: generate and store embedding for semantic search
    try {
      const apiKey = process.env.GOOGLE_GEMINI_API_KEY || ""
      if (!apiKey) {
        console.warn("/api/upload embedding skipped: GOOGLE_GEMINI_API_KEY missing")
      } else {
        const genAI = new GoogleGenerativeAI(apiKey)
        const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" })
        const textForEmbedding = [
          meta.title,
          meta.description ?? "",
          meta.category,
          meta.competition ?? "",
          String(meta.year ?? ""),
          meta.university ?? "",
          (meta.topics ?? []).join(" "),
          (meta.companies ?? []).join(" "),
        ].join(" \n ")

        const embedWithRetry = async () => {
          const attempts = 3
          for (let attempt = 1; attempt <= attempts; attempt++) {
            try {
              return await embedModel.embedContent(textForEmbedding)
            } catch (err: any) {
              const status = err?.status || err?.statusCode
              const retriable = status === 500 || status === 502 || status === 503 || status === 504
              console.warn(
                `/api/upload embedding attempt ${attempt} failed (status=${status ?? "n/a"})`,
                err
              )
              if (!retriable || attempt === attempts) throw err
              await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
            }
          }
        }

        const embeddingRes = await embedWithRetry()
        const vec = (embeddingRes as any)?.embedding?.values as number[] | undefined
        if (vec && Array.isArray(vec) && vec.length > 0) {
          const normalizedVec = normalizeVector(vec)
          const { error: embedUpsertError } = await supabase
            .from("paper_embeddings")
            .upsert({
              paper_id: data.id,
              content: textForEmbedding,
              metadata: insert as any,
              embedding: normalizedVec as any,
            })
          if (embedUpsertError) {
            console.error("/api/upload embedding upsert error", embedUpsertError)
          }
        } else {
          console.warn("/api/upload embedding returned empty vector", embeddingRes)
        }
      }
    } catch (e) {
      console.warn("/api/upload embedding upsert failed", e)
    }

    return NextResponse.json({ paperId: data.id, storagePath: path })
  } catch (err: any) {
    console.error("/api/upload error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
