'use client';
import styles from "./page.module.css";

export default function Home() {
  const handleLogin = () => {
    // Let the backend handle state, scopes, URL encoding, etc.
    window.location.href = "/api/login";
  };

  return (
    <div className={styles.page}>
      <button onClick={handleLogin}>Login with Cognito</button>
    </div>
  );
}
