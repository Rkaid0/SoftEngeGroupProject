'use client';
import { useEffect, useState } from "react";
import { requireAuth, LOGOUT_URL, S3_URL } from "@/utils/auth";

export default function UserDashboard() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
  const url = new URL(window.location.href);
  const id = url.searchParams.get("id");

  if (id) {
    localStorage.setItem("id_token", id);
  }

  const token = localStorage.getItem("id_token");
  if (!token) {
    router.push("/login");
    return;
  }

  const decoded = JSON.parse(atob(token.split(".")[1]));
  setEmail(decoded.email);
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
      <button onClick={() => window.location.href = LOGOUT_URL}>Log Out</button>
    </div>
  );
}
