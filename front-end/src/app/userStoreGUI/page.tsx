'use client'
import { useRouter } from "next/navigation"

export default function UserStoreGUI() {
  const router = useRouter()

  return (
    <div>
      <h1>Stores</h1>
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    </div>
  )
}