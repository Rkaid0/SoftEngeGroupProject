'use client';
import { useEffect, useState } from "react";
import { requireAuth, S3_URL, LOGOUT } from "@/utils/auth";

export default function UserDashboard() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) setEmail(userEmail);
    else {window.location.href = `${S3_URL}`;
      return;}
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>

      {email && (
        <p>Signed in as: <strong>{email}</strong></p>
      )}

      <button onClick={() => window.location.href = `${S3_URL}/reviewActivity`}>Review Activity</button>
      <button onClick={() => window.location.href = `${S3_URL}/reviewHistory`}>Review History</button>
      <button onClick={() => window.location.href = `${S3_URL}/userStoreGUI`}>Store GUI</button>
      <button onClick={LOGOUT}>Log Out</button>
    </div>
  );
}
