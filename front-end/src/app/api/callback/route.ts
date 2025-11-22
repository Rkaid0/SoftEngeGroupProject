import { NextRequest, NextResponse } from "next/server";
import { Issuer } from "openid-client";

export async function GET(req: NextRequest) {
  console.log("Callback route hit!");

  const url = req.nextUrl.toString();
  console.log("Full callback URL:", url);

  const issuer = await Issuer.discover(
    "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_40SpM0Fc9"
  );

  const client = new issuer.Client({
    client_id: "1jlbe809q10rf8v7849be20o6l", // same as login route
    token_endpoint_auth_method: "none",
  });

  // This extracts ?code=... & ?state=...
  const params = client.callbackParams(url);
  console.log("Parsed callback params:", params);

  const tokenSet = await client.callback(
    "http://localhost:3000/api/callback",
    params,
    { state: params.state } // OPTIONAL: validates state
  );

  console.log("Tokens received:", tokenSet);

  const response = NextResponse.redirect("http://localhost:3000");

  if (tokenSet.access_token) {
    response.cookies.set("cognito_access_token", tokenSet.access_token, {
      httpOnly: true,
      path: "/",
    });
  }

  if (tokenSet.id_token) {
    response.cookies.set("cognito_id_token", tokenSet.id_token, {
      httpOnly: false,
      path: "/",
    });
  }

  return response;
}
