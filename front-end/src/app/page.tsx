'use client';
import styles from "./page.module.css";
import { useRouter } from "next/navigation"

export default function Home() {
  const handleLogin = () => {
    // Let the backend handle state, scopes, URL encoding, etc.
    window.location.href = "/api/login";
  };
  const router = useRouter();

  return (
    <div className={styles.page}>
      <button onClick={() => handleLogin()}>Login to Johns Shops</button>
    </div>
  )
}
