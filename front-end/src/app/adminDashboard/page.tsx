'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserFromCookie } from "@/utils/getUserFromCookie"

export default function AdminDashboard() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const user = getUserFromCookie()

    if (!user) {
      router.push("/login")
      return
    }

    if (user.email !== "johnsshops3733@gmail.com") {
      router.push("/userDashboard")
      return
    }

    setEmail(user.email)
  }, [])

  return (
    <div>
      <h1>Admin Dashboard</h1>
      {email && <p>Admin signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/adminStoreGUI")}>Store GUI</button>
      <button onClick={() => router.push("/api/logout")}>Log Out</button>
    </div>
  )
}