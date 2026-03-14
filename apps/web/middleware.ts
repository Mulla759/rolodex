import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server misconfigured: ADMIN_SECRET not set" },
      { status: 500 },
    );
  }

  const cookieValue = req.cookies.get("ADMIN_SECRET")?.value;
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (cookieValue === secret || bearerToken === secret) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: "/admin/:path*",
};
