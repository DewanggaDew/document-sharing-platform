import { NextResponse } from "next/server"
import { unstable_noStore as noStore } from "next/cache"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    noStore()
    const supabase = getSupabaseServer()
    const { data: row, error } = await supabase
      .from("papers")
      .select("*")
      .eq("id", params.id)
      .single()

    if (error && error.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { data: updated, error: updateErr } = await supabase.rpc("increment_paper_views", { paper_uuid: params.id, step: 1 })
    if (updateErr) {
      console.error("/api/papers/[id] increment views error", updateErr)
    }

    const latest = updated ?? row

    return NextResponse.json({
      ...latest,
      views: Number(latest?.views ?? 0),
      downloads: Number(latest?.downloads ?? 0),
      likes: Number(latest?.likes ?? 0),
      file_size: Number(latest?.file_size ?? latest?.fileSize ?? 0),
    })
  } catch (err: any) {
    console.error("/api/papers/[id] error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
