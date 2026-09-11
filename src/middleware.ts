import { NextResponse } from "next/server";
import { edgeAuth } from "@/server/auth/edge";

export default edgeAuth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL(`/ingresar?next=${encodeURIComponent(pathname)}`, req.url));
    if (user.role !== "ADMIN") return NextResponse.redirect(new URL("/cuenta", req.url));
  }
  if (pathname.startsWith("/cuenta") && !user) {
    return NextResponse.redirect(new URL(`/ingresar?next=${encodeURIComponent(pathname)}`, req.url));
  }
  if ((pathname === "/ingresar" || pathname === "/registro") && user) {
    return NextResponse.redirect(new URL(user.role === "ADMIN" ? "/admin" : "/cuenta", req.url));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/ingresar", "/registro"],
};
