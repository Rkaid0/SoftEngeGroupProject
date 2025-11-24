import { NextRequest, NextResponse } from "next/server";
import { Issuer } from "openid-client";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  console.log("Callback route hit!");

  const url = req.nextUrl.toString();
  console.log("Full callback URL:", url);

  const issuer = await Issuer.discover(
    "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_40SpM0Fc9"
  );

  const client = new issuer.Client({
    client_id: "1jlbe809q10rf8v7849be20o6l",
    token_endpoint_auth_method: "none",
  });

  const params = client.callbackParams(url);
  console.log("Parsed callback params:", params);

  const tokenSet = await client.callback(
    "http://localhost:3000/api/callback",
    params,
    { state: params.state }
  );

  console.log("Tokens received:", tokenSet);

  const idToken = tokenSet.id_token;
  let email: string | null = null;

  if (idToken) {
    const decoded: any = jwt.decode(idToken);
    email = decoded?.email || null;
    console.log("Decoded email:", email);
  }

  // ❗ Return a redirect response object
  const redirectUrl =
    email === "johnsshops3733@gmail.com"
      ? "http://localhost:3000/adminDashboard"
      : "http://localhost:3000/userDashboard";

  const response = NextResponse.redirect(redirectUrl);

  // Add cookies to THIS response
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
