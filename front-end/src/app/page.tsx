'use client';
import { CLIENT_ID, REDIRECT_URI } from "@/utils/auth";
import styles from "./page.module.css";

export default function Home() {
  const handleLogin = () => {
    const clientId = CLIENT_ID;
    const domain = "shopapp.auth.us-east-1.amazoncognito.com";
    const redirectUri = encodeURIComponent(REDIRECT_URI);

    const loginUrl =
      `https://${domain}/login` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&scope=openid+email+profile` +
      `&redirect_uri=${redirectUri}`;

    window.location.href = loginUrl;
  };

  return (
    <div className={styles.page}>
      <button onClick={handleLogin}>Login to Johns Shops</button>
    </div>
  );
}
