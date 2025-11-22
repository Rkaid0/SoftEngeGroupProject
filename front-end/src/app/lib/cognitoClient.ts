import { Issuer, Client } from 'openid-client';

let cachedClient: Client | null = null;

export async function getCognitoClient(): Promise<Client> {
  if (cachedClient) return cachedClient;

  const issuer = await Issuer.discover('https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Kn3a3yDZ5');

  cachedClient = new issuer.Client({
    client_id: process.env.COGNITO_CLIENT_ID!,
    redirect_uris: [process.env.COGNITO_REDIRECT_URI!],
    response_types: ['code'],
  });

  return cachedClient;
}