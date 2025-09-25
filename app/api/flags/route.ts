import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/auth"
import { createFlagSchema } from "@/lib/validators/flags"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || undefined
    const decoded = await requireAuth(authHeader)
    const userId = decoded.uid

    const body = await req.json().catch(() => ({}))
    const parsed = createFlagSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
    }
    const { paperId, reason } = parsed.data

    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from("flags")
      .insert({ paper_id: paperId, user_id: userId, reason, status: "open" })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ id: data?.id })
  } catch (err: any) {
    console.error("/api/flags POST error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
