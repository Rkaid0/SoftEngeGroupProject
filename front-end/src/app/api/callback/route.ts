import { NextRequest, NextResponse } from 'next/server';
import { Issuer } from 'openid-client';

export async function GET(req: NextRequest) {
  try {
    const issuer = await Issuer.discover(
      `https://cognito-idp.${process.env.COGNITO_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`
    );

    const client = new issuer.Client({
      client_id: process.env.COGNITO_CLIENT_ID!,
      client_secret: process.env.COGNITO_CLIENT_SECRET!,
      redirect_uris: [process.env.COGNITO_REDIRECT_URI!],
      response_types: ['code'],
    });

    // Get ?code=... & ?state=...
    const params = client.callbackParams(req.url);

    // ⭐ Correct usage: no third argument needed
    const tokenSet = await client.callback(
      process.env.COGNITO_REDIRECT_URI!,
      params
    );

    const access = tokenSet.access_token;
    const id = tokenSet.id_token;

    const res = NextResponse.redirect('http://localhost:3000/');

    if (access) {
      res.cookies.set('cognito_access_token', access, {
        httpOnly: true,
        path: '/',
      });
    }

    if (id) {
      res.cookies.set('cognito_id_token', id, {
        httpOnly: false,
        path: '/',
      });
    }

    return res;
  } catch (err) {
    console.error("Callback error:", err);
  }
}
