import { type NextRequest, NextResponse } from "next/server"
import type { IssueReportRequest } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const body: IssueReportRequest = await request.json()
    const { token, content, city, coordinates, district } = body

    if (!token || !content || !city || !district || !coordinates) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    console.log("Graffiti report submitted:", { content, city, district, coordinates })

    return NextResponse.json({
      message: "Graffiti report submitted successfully",
      reportId: `graffiti-${Date.now()}`,
      status: "pending",
    })
  } catch (error) {
    console.error("Graffiti report error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
