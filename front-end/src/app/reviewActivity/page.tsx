'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserFromCookie } from "@/utils/getUserFromCookie"

export default function ReviewActivity() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const user = getUserFromCookie()

    if (!user) {
      router.push("/login")
      return
    }

    setEmail(user.email)
  }, [])

  return (
    <div>
      <h1>Review Activity</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    </div>
  )
}