// src/app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCognitoClient } from '../lib/cognitoClient';
import { setUserCookie } from '../lib/authCookies';

export async function GET(req: NextRequest) {
  try {
    const client = await getCognitoClient();

    const url = new URL(req.url);
    const params = client.callbackParams(url.toString());

    const nonce = req.cookies.get('cognito_nonce')?.value;
    const state = req.cookies.get('cognito_state')?.value;

    const tokenSet = await client.callback(
      process.env.COGNITO_REDIRECT_URI!,
      params,
      { nonce, state }
    );

    const userInfo = await client.userinfo(tokenSet.access_token!);

    const res = NextResponse.redirect(new URL('/', req.url));
    // Store userInfo in a cookie (again: demo only)
    res.cookies.set('cognito_user', JSON.stringify(userInfo), { path: '/' });
    // Clear temporary cookies
    res.cookies.delete('cognito_nonce');
    res.cookies.delete('cognito_state');

    return res;
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
