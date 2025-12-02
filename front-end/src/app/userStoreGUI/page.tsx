'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { requireAuth, S3_URL, LOGOUT, detectLocal } from "@/utils/auth";

export default function UserStoreGUI() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) setEmail(userEmail);
    else if (detectLocal() == false) {
      window.location.href = `${S3_URL}`;
      return;
    }
  }, []);

  return (
    <div>
      <h1>Stores</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => window.location.href = `${S3_URL}/createStore`}>Create Store</button>
      <button onClick={() => window.location.href = `${S3_URL}/create_store_chain`}>Create Store Chain</button>
      <button onClick={() => router.push("/userDashboard")}>Dashboard</button>
    </div>
  )
}