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
      <button onClick={handleLogin}>Login with Cognito</button>
      <button onClick={() => handleLogin()}>Login with Cognito</button>
        <h3>test</h3>

      <button onClick={() => router.push("/userDashboard")}>
        Go to User Dashboard
      </button>

      <button onClick={() => router.push("/adminDashboard")}>
        Go to Admin Dashboard
      </button>
    </div>
  )
}
