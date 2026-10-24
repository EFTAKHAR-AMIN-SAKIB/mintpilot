import { NextRequest } from "next/server";

export function getSessionIdFromRequest(request: NextRequest): string {
  // Check custom header first
  const headerSession = request.headers.get("x-mintpilot-session");
  if (headerSession && headerSession.trim()) {
    return headerSession.trim();
  }

  // Check cookie
  const cookieSession = request.cookies.get("mintpilot_session")?.value;
  if (cookieSession && cookieSession.trim()) {
    return cookieSession.trim();
  }

  // Fallback to client IP or default
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "default-session";
  return `session-${ip.replace(/[^a-zA-Z0-9]/g, "-")}`;
}
