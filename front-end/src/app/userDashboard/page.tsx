'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserFromCookie } from "@/utils/getUserFromCookie"

export default function UserDashboard() {
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
      <h1>Dashboard</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/reviewActivity")}>Review Activity</button>
      <button onClick={() => router.push("/reviewHistory")}>Review History</button>
      <button onClick={() => router.push("/userStoreGUI")}>Store GUI</button>
      <button onClick={() => router.push("/api/logout")}>Log Out</button>
    </div>
  )
}