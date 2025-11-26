'use client';

import { useEffect, useState } from "react";
import { LOGOUT, requireAuth, S3_URL } from "@/utils/auth";

const ADMIN_EMAIL = "johnsshops3733@gmail.com";

export default function AdminDashboard() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = requireAuth();

    if (!userEmail) window.location.href = `${S3_URL}`;

    if (userEmail !== ADMIN_EMAIL) {
      // Not an admin → send to user dashboard
      window.location.href = `${S3_URL}/userDashboard`;
      return;
    }

    setEmail(userEmail);
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}

      <button onClick={() => window.location.href = `${S3_URL}/adminStoreGUI`}>
        Store GUI
      </button>

      <button onClick={LOGOUT}>
        Log Out
      </button>
    </div>
  );
}
