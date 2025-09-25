import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || undefined
    const decoded = await requireAuth(authHeader)
    const userId = decoded.uid
    const supabase = getSupabaseServer()

    // Gate: require at least 1 upload (count user's papers)
    const { count, error: countErr } = await supabase
      .from("papers")
      .select("id", { count: "exact", head: true })
      .eq("author_user_id", userId)

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 })
    }
    const uploadsCount = count ?? 0
    if (uploadsCount < 1) {
      return NextResponse.json({ error: "Upload a paper to access downloads" }, { status: 403 })
    }

    // Get paper
    const { data: paper, error: paperErr } = await supabase
      .from("papers")
      .select("*")
      .eq("id", params.id)
      .single()

    if (paperErr && paperErr.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (paperErr) {
      return NextResponse.json({ error: paperErr.message }, { status: 500 })
    }
    if (!paper) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (paper.status !== "active") {
      return NextResponse.json({ error: "Unavailable" }, { status: 403 })
    }

    const storagePath = paper.storage_path as string

    // Signed URL (1 hour)
    const fileName = (storagePath.split("/").pop() || "document").toString()
    const { data: signed, error: urlErr } = await supabase
      .storage
      .from("papers")
      .createSignedUrl(storagePath, 60 * 60, { download: fileName })

    if (urlErr) {
      return NextResponse.json({ error: urlErr.message }, { status: 500 })
    }

    // Increment downloads (best-effort)
    const { error: updateErr } = await supabase
      .from("papers")
      .update({ downloads: (paper.downloads || 0) + 1, updated_at: new Date().toISOString() })
      .eq("id", params.id)
    if (updateErr) {
      console.error("/api/papers/[id]/download increment downloads error", updateErr)
    }

    return NextResponse.json({ url: signed?.signedUrl })
  } catch (err: any) {
    console.error("/api/papers/[id]/download error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
