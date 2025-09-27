import { NextResponse } from "next/server"
import { unstable_noStore as noStore } from "next/cache"
import { requireAuth } from "@/lib/server/auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    noStore()
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

    const { data: fileData, error: downloadErr } = await supabase
      .storage
      .from("papers")
      .download(storagePath)

    if (downloadErr || !fileData) {
      return NextResponse.json({ error: downloadErr?.message || "Download failed" }, { status: 500 })
    }

    const { data: updatedPaper, error: updateErr } = await supabase
      .rpc("increment_paper_downloads", { paper_uuid: params.id, step: 1 })
    if (updateErr) {
      console.error("/api/papers/[id]/download increment downloads error", updateErr)
    }

    const readableStream = fileData.stream()
    const fileName = (storagePath.split("/").pop() || "document").toString()
    return new NextResponse(readableStream, {
      headers: {
        "Content-Type": (paper.file_type as string) || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "private, no-store",
        "X-Downloads": updatedPaper?.downloads ? String(updatedPaper.downloads) : undefined,
      },
    })
  } catch (err: any) {
    console.error("/api/papers/[id]/download error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
