'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserFromCookie } from "@/utils/getUserFromCookie"
import { requireAuth, LOGOUT_URL, S3_URL, LOGOUT } from "@/utils/auth";

export default function UserStoreGUI() {
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
      <h1>Stores</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => window.location.href = `${S3_URL}/createStore`}>Create Store</button>
      <button onClick={() => window.location.href = `${S3_URL}/create_store_chain`}>Create Store Chain</button> <h3>USER SHOULD NOT BE ALLOWED TO CREATE STORE CHAIN THATS AN ADMIN ONLY USE CASE</h3>
      <button onClick={() => window.location.href = `${S3_URL}/userDashboard`}>Dashboard</button>
    </div>
  )
}