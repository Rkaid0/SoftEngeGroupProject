'use client'
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <button onClick={() => router.push("/adminStoreGUI")}>Store GUI</button>
      <button onClick={() => router.push("/api/logout")}>Log Out</button>
    </div>
  )
}