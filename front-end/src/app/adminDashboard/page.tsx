'use client';

import { useEffect, useState } from "react";
import { detectLocal, LOGOUT, requireAuth, S3_URL } from "@/utils/auth";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "johnsshops3733@gmail.com";

export default function AdminDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userEmail = requireAuth();

    if(detectLocal() == true){
          return;
    }

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

      <button onClick={() => router.push("/adminStoreGUI")}>
        Store GUI
      </button>

      <button onClick={LOGOUT}>
        Log Out
      </button>
    </div>
  );
}
