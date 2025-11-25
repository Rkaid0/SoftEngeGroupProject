'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { requireAuth, S3_URL } from "@/utils/auth"

export default function ReviewHistory() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
      const userEmail = requireAuth();
      if (userEmail) setEmail(userEmail);
      else {window.location.href = `${S3_URL}`;
        return;}
    }, []);

  return (
    <div>
      <h1>Review History</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    </div>
  )
}