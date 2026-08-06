export const AUTH_COOKIE_NAME = "dnd_auth";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 dias, expiracion deslizante

// btoa/atob (no Buffer): el middleware corre en el Edge runtime, que no expone
// Buffer pero si estas APIs Web estandar.
export function basicAuthValue(user: string, password: string): string {
  return btoa(`${user}:${password}`);
}

// Server-side unicamente: compara el valor de la cookie contra AUTH_USER/AUTH_PASSWORD.
export function isValidAuthCookie(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = basicAuthValue(process.env.AUTH_USER ?? "", process.env.AUTH_PASSWORD ?? "");
  return cookieValue === expected;
}
