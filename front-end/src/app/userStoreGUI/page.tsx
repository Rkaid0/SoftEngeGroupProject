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
  const [storeChainName, setStoreChainName] = useState("")
  const [storeAddress, setStoreAddress] = useState("")

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
                  name: chainName,
                  url: chainURL
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
  
  const createStore = async () => {
      try {
        const chain = chains.find(c => c.name.toLowerCase() === storeChainName.toLowerCase());
        if (!chain) {
          alert("Chain not found");
          return;
        }
        await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createStore",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("id_token")}`
            },
            body: JSON.stringify({
              storeAddress,
              storeChainID: chain.idstoreChain
            })
          }
        );
        setStoreChainName("")
        setStoreAddress("")
        fetchChains()
      } catch (err) {
        console.error("Error creating store:", err)
      }
    }

  return (
    <div>
      <h1>Stores</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Dashboard</button>
      <h2>Create Store Chain</h2>
      <input type="text" value = {chainName} onChange = {e => setChainName(e.target.value) } placeholder = "Chain Name" />
      <input type="text" value = {chainURL} onChange = {e => setChainURL(e.target.value) } placeholder = "Chain URL" />
      <button onClick = {createStoreChain}>Create Store Chain</button>
      
      <h2>Create Store</h2>
      <input type="text" value={storeChainName} onChange={e => setStoreChainName(e.target.value)} placeholder="Store Chain Name" />
      <input type="text" value={storeAddress} onChange={e => setStoreAddress(e.target.value)} placeholder="Store Address" />
      <button onClick={createStore}>Create Store</button>
      <h2>Existing Store Chains</h2>
      <ul>
        {chains.map((chain) => (
          <li key={chain.idstoreChain}>
            <strong>{chain.name}</strong> — <a href={chain.url} target="_blank" rel="noopener noreferrer">{chain.url}</a>
            <ul>
              {chain.stores.length === 0 && <li>No stores</li>}
              {chain.stores.map((s: any) => (
                <li key={s.idStores}>{s.storeAddress}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}