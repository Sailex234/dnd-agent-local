import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME, isValidAuthCookie } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const cookieValue = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!isValidAuthCookie(cookieValue)) {
    // req.url usa el hostname:puerto en el que escucha el proceso Node (no el Host
    // real del cliente), asi que atras de un reverse proxy hay que armar la URL con
    // los headers x-forwarded-* en vez de req.url.
    const forwardedHost = req.headers.get("x-forwarded-host");
    const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
    const base = forwardedHost ? `${forwardedProto}://${forwardedHost}` : req.url;
    const loginUrl = new URL("/login", base);
    return NextResponse.redirect(loginUrl);
  }

  // Sesion valida: expiracion deslizante, se reemite la cookie con el Max-Age reseteado.
  const res = NextResponse.next();
  res.cookies.set(AUTH_COOKIE_NAME, cookieValue as string, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
