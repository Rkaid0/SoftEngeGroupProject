// --- Cognito / API / S3 CONFIG ---
export const COGNITO_DOMAIN = "https://shopapp.auth.us-east-1.amazoncognito.com";
export const CLIENT_ID = "fsft16o7kkjtpl7a08ubo94ih";
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
export function requireAuth(): string | null {
  const email = getUserEmailFromCookie();
  if (!email) {
    window.location.href = LOGIN_URL;
    return null;
  }
  return email;
}
