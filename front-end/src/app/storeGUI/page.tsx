'use client'
import { useRouter } from "next/navigation"

export default function StoreGUI() {
  const router = useRouter()

  return (
    <div>
      <h1>Store GUI</h1>
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    </div>
  )
}