'use client'
import { useRouter } from "next/navigation"

export default function ReviewActivity() {
  const router = useRouter()

  return (
    <div>
      <h1>Review Activity</h1>
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    </div>
  )
}