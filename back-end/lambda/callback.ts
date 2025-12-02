const jwt = require("jsonwebtoken");
const https = require("https");

// ---------- CONFIG ----------
const COGNITO_DOMAIN = "https://shopapp.auth.us-east-1.amazoncognito.com";
const CLIENT_ID = "5ba3klhuempramj1bun5g486s3";

const REDIRECT_URI =
  "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/api/callback";

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

  if (!tokenResponse.id_token || !tokenResponse.access_token) {
    console.error("Token exchange failed:", tokenResponse);
    return { statusCode: 500, body: "Token exchange failed" };
  }

  // --- Decode ID token to extract email ---
  const decoded = jwt.decode(tokenResponse.id_token);
  const email = decoded?.email || null;

  console.log("User email:", email);

  // --- Redirect to correct S3 folder including BOTH tokens ---
  const redirectUrl =
    email === "johnsshops3733@gmail.com"
      ? `${S3_WEBSITE_URL}/adminDashboard/?id=${tokenResponse.id_token}&access=${tokenResponse.access_token}`
      : `${S3_WEBSITE_URL}/userDashboard/?id=${tokenResponse.id_token}&access=${tokenResponse.access_token}`;

  // --- Redirect to S3 site ---
  return {
    statusCode: 302,
    headers: {
      Location: redirectUrl,
    },
  };
};
