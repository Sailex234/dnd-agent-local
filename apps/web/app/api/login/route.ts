import { NextResponse } from "next/server";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME, basicAuthValue } from "@/lib/auth";

export async function POST(req: Request) {
  const { user, password } = await req.json();

  const validUser = typeof user === "string" && user === process.env.AUTH_USER;
  const validPassword = typeof password === "string" && password === process.env.AUTH_PASSWORD;
  if (!validUser || !validPassword) {
    return NextResponse.json({ error: "Usuario o contrasena incorrectos." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, basicAuthValue(user, password), {
    httpOnly: false, // el cliente necesita leerla para armar el header Authorization hacia la API
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
  return res;
}
