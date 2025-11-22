'use client'
import { useRouter } from "next/navigation"

export default function ReviewHistory() {
  const router = useRouter()

  return (
    <div>
      <h1>Review History</h1>
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    </div>
  )
}