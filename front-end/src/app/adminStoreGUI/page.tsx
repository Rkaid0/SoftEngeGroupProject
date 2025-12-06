'use client';
import { useEffect, useState } from "react";
import { requireAuth, LOGOUT, S3_URL, detectLocal } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function UserStoreGUI() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const [chains, setChains] = useState<any[]>([])
  const [deleteName, setDeleteName] = useState("")

  useEffect(() => {
    const userEmail = requireAuth();

    if(detectLocal() == true){
      return;
    }

    // Not logged in → send to login page (static file)
    if (!userEmail) {
      window.location.href = `${S3_URL}`;
      return;
    }

    // Not admin → send to user dashboard
    if (userEmail !== "johnsshops3733@gmail.com") {
      window.location.href = `${S3_URL}/userDashboard/`;
      return;
    }

    setEmail(userEmail);
    fetchChains()
  }, []);

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
  const deleteChain = async () => {
    if (!deleteName.trim()) {
      alert("Please enter a store chain name.");
      return;
    }

    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/removeStoreChain",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: deleteName.trim(),  // <-- send only the name
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        alert("Error deleting chain: " + json.error);
        return;
      }

      alert(`Deleted store chain: ${deleteName}`);
      setDeleteName("");
      fetchChains();  // refresh UI

    } catch (err) {
      console.error(err);
      alert("Error deleting store chain.");
    }
  };
  
  return (
    <div>
      <h1>Stores</h1>
      {email && (<p>Admin signed in as: <strong>{email}</strong></p>)}
      <button onClick={() => router.push("/adminDashboard")}>Back to Dashboard</button>
      <button onClick={LOGOUT}>Log Out</button>
      <h2 style={{ marginTop: "20px" }}>Existing Store Chains</h2>
      <ul>
        {chains.map((chain) => (
          <li key={chain.id}>
            <strong>{chain.name}</strong> — {chain.url}
          </li>
        ))}
      </ul>
      <h3 style={{ marginTop: "30px" }}>Delete a Store Chain</h3>
      <input type="text" placeholder="Enter store chain name" value={deleteName} onChange={(e) => setDeleteName(e.target.value)}
        style={{ padding: "6px", marginRight: "10px" }}/>
      <button onClick={deleteChain}
        style={{ padding: "6px 12px", background: "red", color: "white" }}>Delete Chain</button>
    </div>
  );
}
