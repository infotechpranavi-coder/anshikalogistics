import { NextResponse } from "next/server";
import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth.config";

const authPages = new Set(["/login", "/register"]);
const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const { pathname, search } = request.nextUrl;
  const isAuthenticated = Boolean(request.auth?.user);

  if (!isAuthenticated && !authPages.has(pathname)) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && authPages.has(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/trips/:path*",
    "/vehicles/:path*",
    "/drivers/:path*",
    "/invoices/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/login",
    "/register",
  ],
};
