// --- Cognito / API / S3 CONFIG ---
export const COGNITO_DOMAIN = "https://shopapp.auth.us-east-1.amazoncognito.com";
export const CLIENT_ID = "2quljq2c45e8jk4k90ee14irv8";
export const REDIRECT_URI = "https://gic7c5dyqj.execute-api.us-east-1.amazonaws.com/prod/api/callback";
export const S3_URL = "http://soft-enge-static-website-bucket.s3-website-us-east-1.amazonaws.com";

export const LOGIN_URL =
  `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}` +
  `&response_type=code&scope=openid+email+profile` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

export const LOGOUT_URL =
  `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}` +
  `&logout_uri=${encodeURIComponent(S3_URL)}`;

// -----------------------------------------------------------
// Decode JWT token (client-side only)
// -----------------------------------------------------------
export function decodeJwt(token: string) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

// -----------------------------------------------------------
// Read email from the "cognito_id_token" cookie
// Returns null if not logged in
// -----------------------------------------------------------
export function getUserEmailFromCookie(): string | null {
  const cookies = document.cookie.split(";").map(c => c.trim());
  const idTokenCookie = cookies.find(c => c.startsWith("cognito_id_token="));

  if (!idTokenCookie) return null;

  const token = idTokenCookie.replace("cognito_id_token=", "");
  const decoded = decodeJwt(token);

  return decoded?.email ?? null;
}

// -----------------------------------------------------------
// Redirect user to Cognito Hosted UI login if not authenticated
// Returns the email if logged in
// -----------------------------------------------------------
export function requireAuth() {
  // 1. Try reading token from URL
  const url = new URL(window.location.href);
  const tokenFromUrl = url.searchParams.get("id");

  if (tokenFromUrl) {
    localStorage.setItem("id_token", tokenFromUrl);
    return decodeEmail(tokenFromUrl);
  }

  // 2. Fallback to token stored previously
  const token = localStorage.getItem("id_token");
  if (!token) return null;

  return decodeEmail(token);
}

function decodeEmail(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.email || null;
  } catch {
    return null;
  }
}

export function LOGOUT() {
  localStorage.removeItem("id_token");

  window.location.href =
    `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}` +
    `&logout_uri=${S3_URL}`;
}
