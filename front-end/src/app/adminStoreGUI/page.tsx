'use client';
import { useEffect, useState } from "react";
import { requireAuth, LOGOUT, S3_URL } from "@/utils/auth";

export default function UserStoreGUI() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = requireAuth();

    // Not logged in → send to login page (static file)
    if (!userEmail) {
      window.location.href = `${S3_URL}`;
      return;
    }

    // Not admin → send to user dashboard
    if (userEmail !== "johnsshops3733@gmail.com") {
      window.location.href = `${S3_URL}/userDashboard/index.html`;
      return;
    }

    setEmail(userEmail);
  }, []);

  return (
    <div>
      <h1>Stores</h1>

      {email && (
        <p>Admin signed in as: <strong>{email}</strong></p>
      )}

      <button onClick={() => window.location.href = `${S3_URL}/adminDashboard/index.html`}>
        Back to Dashboard
      </button>

      <button onClick={LOGOUT}>
        Log Out
      </button>
    </div>
  );
}
