import { NextResponse } from 'next/server';
import { generators } from 'openid-client';
import { getCognitoClient } from '../../lib/cognitoClient';

export async function GET() {
  try{
    const client = await getCognitoClient();

    const nonce = generators.nonce();
    const state = generators.state();

    const redirectUri = process.env.COGNITO_REDIRECT_URI;

    const authUrl = client.authorizationUrl({
      scope: 'email openid profile',
      state,
      nonce,
      redirect_uri: redirectUri,
    });

    const res = NextResponse.redirect(authUrl);

    return res;
  }
  catch(err){
    console.error("Login error:", err);
  }
}
