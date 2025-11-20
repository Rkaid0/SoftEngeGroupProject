'use client'
import Image from "next/image";
import styles from "./page.module.css";

const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!;

export default function Home() {
  const handleLogin = () => {
    const url = new URL(`https://${domain}/oauth2/authorize`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'email openid phone');
    url.searchParams.set('redirect_uri', redirectUri);

    window.location.href = url.toString();
  };

  return (
    <div className={styles.page}>
      <button onClick={() => handleLogin()}>Login with Cognito</button>
    </div>
  );
}
