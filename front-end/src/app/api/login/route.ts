import { NextResponse } from "next/server";
import { Issuer } from "openid-client";

export async function GET() {
  // Discover Cognito config
  const issuer = await Issuer.discover(
    "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_40SpM0Fc9"
  );

  const client = new issuer.Client({
    client_id: "1jlbe809q10rf8v7849be20o6l", // <-- paste real ID here
    token_endpoint_auth_method: "none",
  });

  // Generate a secure random state value
  const state = crypto.randomUUID();

  // Build Hosted UI login URL
  const url = client.authorizationUrl({
    redirect_uri: "http://localhost:3000/api/callback", // <-- your callback URL
    scope: "openid email profile",
    state, // <----- REQUIRED
  });

  console.log("Login redirect with state:", state);

  return NextResponse.redirect(url);
}
