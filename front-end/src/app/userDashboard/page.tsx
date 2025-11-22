'use client'
import { useRouter } from "next/navigation"

export default function UserDashboard() {
  const router = useRouter()

  return (
    <div>
      <h1>User Dashboard</h1>
      <button onClick={() => router.push("/reviewActivity")}>Review Activity</button>
      <button onClick={() => router.push("/reviewHistory")}>Review History</button>
      <button onClick={() => router.push("/userStoreGUI")}>Store GUI</button>
    </div>
  )
}