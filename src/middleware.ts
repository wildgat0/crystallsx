import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!token || token.role !== "admin") {
      return NextResponse.redirect(new URL("/cuenta/login", req.url));
    }
  }

  if (
    pathname.startsWith("/cuenta") &&
    !pathname.startsWith("/cuenta/login") &&
    !pathname.startsWith("/cuenta/registro")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/cuenta/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*"],
};
