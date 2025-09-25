import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
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

    const views = (row.views || 0) + 1
    const { error: updateErr } = await supabase
      .from("papers")
      .update({ views, updated_at: new Date().toISOString() })
      .eq("id", params.id)

    if (updateErr) {
      // Log but still return the original row
      console.error("/api/papers/[id] increment views error", updateErr)
    }

    return NextResponse.json({ ...row, views })
  } catch (err: any) {
    console.error("/api/papers/[id] error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
