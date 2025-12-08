// --- Cognito / API / S3 CONFIG ---
export const COGNITO_DOMAIN = "https://shopapp.auth.us-east-1.amazoncognito.com";
export const CLIENT_ID = "5ba3klhuempramj1bun5g486s3";
export const REDIRECT_URI = "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/api/callback";
export const LOGOUT_URI = "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/api/logout";
export const S3_URL = "http://soft-enge-static-website-bucket.s3-website-us-east-1.amazonaws.com";

export const LOGIN_URL =
  `${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}` +
  `&response_type=code&scope=openid+email+profile` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

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

  // ------ Read incoming URL params ------
  const idToken = url.searchParams.get("id");
  const accessToken = url.searchParams.get("access");
  const userID = url.searchParams.get("userID");

  // ------ Store tokens if present ------
  if (idToken) {
    localStorage.setItem("id_token", idToken);
  }
  else{
    console.log("ERROR: Did not get id_token.");
  }
  if (accessToken) {
    localStorage.setItem("access_token", accessToken);
  }
  else{
    console.log("ERROR: Did not get access_token.");
  }
  if (userID) {
    localStorage.setItem("user_id", userID);
  }
  else{
    console.log("ERROR: Did not get user_id.");
  }

  // ------ Clean up URL ------
  if (idToken || accessToken || userID) {
    window.history.replaceState({}, "", window.location.pathname);
  }

  // ------ Fallback to stored token ------
  const token = localStorage.getItem("id_token");
  if (!token) return null;

  const payload = JSON.parse(atob(token.split(".")[1]));
  const email = payload.email || null;

  return email || null;
}


export function LOGOUT() {
  //remove tokens
  localStorage.removeItem("id_token");
  localStorage.removeItem("access_token");

  const logoutUrl = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&response_type=code&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;

  window.location.href = logoutUrl;
}

export function detectLocal(){
  const currentUrl = window.location.href;
  const targetString: string = 'localhost';

  return currentUrl.includes(targetString);
}
