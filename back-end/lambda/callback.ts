const jwt = require("jsonwebtoken");
const https = require("https");

// ---------- CONFIG ----------
const COGNITO_DOMAIN = "https://shopapp.auth.us-east-1.amazoncognito.com";
const CLIENT_ID = "fsft16o7kkjtpl7a08ubo94ih";

const REDIRECT_URI =
  "https://gic7c5dyqj.execute-api.us-east-1.amazonaws.com/prod/api/callback";

const S3_WEBSITE_URL =
  "http://soft-enge-static-website-bucket.s3-website-us-east-1.amazonaws.com";

// Helper: POST x-www-form-urlencoded
function postForm(url, form) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(form).toString();
    const u = new URL(url);

    const options = {
      hostname: u.hostname,
      path: u.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(JSON.parse(body)));
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log("Callback invoked:", JSON.stringify(event));

  // --- Build request URL ---
  const host = event.headers?.Host || event.headers?.host;
  const path = event.path;
  const queryParams = event.queryStringParameters || {};
  const code = queryParams.code;

  if (!code) {
    console.error("Missing authorization code");
    return { statusCode: 400, body: "Missing ?code=" };
  }

  console.log("Auth code:", code);

  // --- Exchange code for tokens ---
  const tokenEndpoint = `${COGNITO_DOMAIN}/oauth2/token`;

  const tokenResponse = await postForm(tokenEndpoint, {
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
  });

  console.log("Token response:", tokenResponse);

  if (!tokenResponse.id_token) {
    console.error("Token exchange failed:", tokenResponse);
    return { statusCode: 500, body: "Token exchange failed" };
  }

  // --- Decode ID token to extract email ---
  const decoded = jwt.decode(tokenResponse.id_token);
  const email = decoded?.email || null;

  console.log("User email:", email);

  const redirectUrl =
    email === "johnsshops3733@gmail.com"
      ? `${S3_WEBSITE_URL}/adminDashboard`
      : `${S3_WEBSITE_URL}/userDashboard`;

  // --- Cookies ---
  const cookies = [];

  if (tokenResponse.access_token) {
    cookies.push(
      `cognito_access_token=${tokenResponse.access_token}; HttpOnly; Path=/; Secure; SameSite=Lax`
    );
  }

  if (tokenResponse.id_token) {
    cookies.push(
      `cognito_id_token=${tokenResponse.id_token}; Path=/; Secure; SameSite=Lax`
    );
  }

  // --- Redirect to S3 site ---
  return {
    statusCode: 302,
    headers: {
      Location: redirectUrl,
      "Set-Cookie": cookies.join(", "),   // ← FIXED HERE
    },
  };
};
