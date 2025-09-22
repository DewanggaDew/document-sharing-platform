import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase/admin"

export async function GET() {
  try {
    // Touch Firestore instance to ensure Admin SDK is initialized
    const db = getAdminDb()
    const ok = db !== undefined
    return NextResponse.json({ status: "ok", firebaseAdmin: ok })
  } catch (err: any) {
    return NextResponse.json({ status: "error", message: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
