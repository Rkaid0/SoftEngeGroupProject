import { NextResponse } from "next/server";
import { Issuer } from "openid-client";

export async function GET() {
  return NextResponse.redirect("https://shopapp.auth.us-east-1.amazoncognito.com/logout?client_id=1jlbe809q10rf8v7849be20o6l&logout_uri=http://localhost:3000");
}
