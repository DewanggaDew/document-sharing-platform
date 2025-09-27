import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServer()
    const { data: paper, error: paperErr } = await supabase
      .from("papers")
      .select("storage_path, file_type")
      .eq("id", params.id)
      .single()

    if (paperErr && paperErr.code === "PGRST116") {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    if (paperErr) return NextResponse.json({ error: paperErr.message }, { status: 500 })
    if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Stream the object directly using service role to avoid JWT signed URL
    const { data, error: dlErr } = await supabase
      .storage
      .from("papers")
      .download(paper.storage_path as string)

    if (dlErr || !data) return NextResponse.json({ error: dlErr?.message || "Download failed" }, { status: 500 })

    const arrayBuffer = await data.arrayBuffer()
    const fileName = (paper.storage_path as string).split("/").pop() || "document.pdf"
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        "Content-Type": (paper.file_type as string) || "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "private, max-age=60",
      },
    })
  } catch (err: any) {
    console.error("/api/papers/[id]/view error", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}


