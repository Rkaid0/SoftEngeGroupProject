'use client';
import { useEffect, useState } from "react";
import { requireAuth, LOGOUT, S3_URL, detectLocal } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function UserStoreGUI() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userEmail = requireAuth();

    if(detectLocal() == true){
      return;
    }

    // Not logged in → send to login page (static file)
    if (!userEmail) {
      window.location.href = `${S3_URL}`;
      return;
    }

    // Not admin → send to user dashboard
    if (userEmail !== "johnsshops3733@gmail.com") {
      window.location.href = `${S3_URL}/userDashboard/`;
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

      <button onClick={() => router.push("/adminDashboard")}>
        Back to Dashboard
      </button>

      <button onClick={LOGOUT}>
        Log Out
      </button>
    </div>
  );
}
