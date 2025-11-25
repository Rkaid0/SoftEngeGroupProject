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
// Redirect user to Cognito Hosted UI login if not authenticated
// Returns the email if logged in
// -----------------------------------------------------------
export function requireAuth() {
  const url = new URL(window.location.href);

  // Check for tokens in URL
  const idToken = url.searchParams.get("id");
  const accessToken = url.searchParams.get("access");

  if (idToken) {
    localStorage.setItem("id_token", idToken);
  }
  if (accessToken) {
    localStorage.setItem("access_token", accessToken);
  }

  // Remove query params from URL after storing
  if (idToken || accessToken) {
    window.history.replaceState({}, "", window.location.pathname);
  }

  // Fallback to stored token
  const token = localStorage.getItem("id_token");
  if (!token) return null;

  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.email || null;
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
