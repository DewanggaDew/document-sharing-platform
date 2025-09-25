import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/server/auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || undefined
    const decoded = await requireAuth(authHeader)
    const userId = decoded.uid

    const supabase = getSupabaseServer()

    // Fetch uploads for this user
    const { data: uploads, error: uploadsErr } = await supabase
      .from("papers")
      .select("*")
      .eq("author_user_id", userId)
      .order("created_at", { ascending: false })

    if (uploadsErr) {
      return NextResponse.json({ error: uploadsErr.message }, { status: 500 })
    }

    const safeUploads = uploads || []
    const stats = safeUploads.reduce(
      (acc, p: any) => {
        acc.documentsUploaded += 1
        acc.totalDownloads += Number(p.downloads || 0)
        acc.totalViews += Number(p.views || 0)
        acc.totalLikes += Number(p.likes || 0)
        return acc
      },
      { documentsUploaded: 0, totalDownloads: 0, totalViews: 0, totalLikes: 0 }
    )

    // Fetch flags created by this user
    const { data: flags, error: flagsErr } = await supabase
      .from("flags")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (flagsErr) {
      return NextResponse.json({ error: flagsErr.message }, { status: 500 })
    }

    return NextResponse.json({ uploads: safeUploads, flags: flags || [], stats })
  } catch (err: any) {
    console.error("/api/me error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}


