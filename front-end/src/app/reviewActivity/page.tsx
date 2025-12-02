'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { detectLocal, requireAuth, S3_URL } from "@/utils/auth"

export default function ReviewActivity() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
      const userEmail = requireAuth();
      if (userEmail) setEmail(userEmail);
      else if (detectLocal() == false) {window.location.href = `${S3_URL}`;
        return;}
    }, []);

  return (
    <div>
      <h1>Review Activity</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    </div>
  )
}