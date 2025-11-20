// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { generators } from 'openid-client';
import { getCognitoClient } from '../lib/cognitoClient';

export async function GET() {
  const client = await getCognitoClient();

  const nonce = generators.nonce();
  const state = generators.state();

  // We’ll store nonce/state in cookies for the callback
  const res = NextResponse.redirect(
    client.authorizationUrl({
      scope: 'openid email profile',
      state,
      nonce,
    })
  );

  res.cookies.set('cognito_nonce', nonce, { path: '/' });
  res.cookies.set('cognito_state', state, { path: '/' });

  return res;
}
