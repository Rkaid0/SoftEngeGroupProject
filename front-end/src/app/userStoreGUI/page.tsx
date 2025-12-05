'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { requireAuth, S3_URL, LOGOUT, detectLocal } from "@/utils/auth";

export default function UserStoreGUI() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [chainName, setChainName] = useState("")
  const [chainURL, setChainURL] = useState("")
  const [chains, setChains] = useState<any[]>([])

  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) setEmail(userEmail);
    else if (detectLocal() == false) {
      window.location.href = `${S3_URL}`;
      return;
    }
    fetchChains()
  }, []);

  const createStoreChain = async() => {
    try {await fetch(
            "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createStoreChain",{
              method: "POST", 
              headers: {"Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("id_token")}` }, 
              body: JSON.stringify({
                body: {
                  name: chainName,
                  url: chainURL }
              })
            }
        )
      setChainName("")
      setChainURL("")
      await fetchChains()
    }
    catch (err) {console.error("Error creating store chain:", err)}
  }

  const fetchChains = async () => {
    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getStoreChains",
        {
          headers: {"Authorization": `Bearer ${localStorage.getItem("id_token")}`}
        }
      )
      const data = await res.json()
      setChains(data)
    } catch (err) {
      console.error("Error loading store chains:", err)
    }
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