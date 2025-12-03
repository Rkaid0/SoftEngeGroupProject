'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { requireAuth, S3_URL, LOGOUT, detectLocal } from "@/utils/auth";

export default function UserStoreGUI() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [chainName, setChainName] = useState("")
  const [chainURL, setChainURL] = useState("")

  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) setEmail(userEmail);
    else if (detectLocal() == false) {
      window.location.href = `${S3_URL}`;
      return;
    }
  }, []);

  const createStoreChain = async() => {
    try {await fetch(
            "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createStoreChain",{
              method: "POST", 
              headers: {"Content-Type": "application/json" }, 
              body: JSON.stringify({name: chainName, url: chainURL})
            }
        )
      setChainName("")
      setChainURL("")
    }
    catch (err) {console.error("Error creating store chain:", err)}
  }

  return (
    <div>
      <h1>Stores</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Dashboard</button>
      <input type="text" value = {chainName} onChange = {e => setChainName(e.target.value) } placeholder = "Chain Name" />
      <input type="text" value = {chainURL} onChange = {e => setChainURL(e.target.value) } placeholder = "Chain URL" />
      <button onClick = {createStoreChain}>Create Store Chain</button>
    </div>
  )
}