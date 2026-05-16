import { type NextRequest, NextResponse } from "next/server";
import { withApiGuards } from "@/lib/api/security";

export async function POST(request: NextRequest) {
  const blocked = withApiGuards(request);
  if (blocked) return blocked;
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await request.json().catch(() => null)
    : await request.text().catch(() => "");

  return NextResponse.json({
    receivedAt: new Date().toISOString(),
    method: request.method,
    contentType,
    headers: Object.fromEntries(request.headers.entries()),
    body,
  });
}
