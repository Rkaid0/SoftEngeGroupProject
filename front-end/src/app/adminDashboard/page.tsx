'use client';
import { useEffect, useState } from "react";
import { requireAuth, LOGOUT, S3_URL, detectLocal } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function adminDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const [chains, setChains] = useState<any[]>([])
  const [deleteName, setDeleteName] = useState("")
  const [deleteStoreAddress, setDeleteStoreAddress] = useState("");
  const [deleteStoreChainName, setDeleteStoreChainName] = useState("");

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

  const deleteStore = async () => {
    if (!deleteStoreAddress.trim() || !deleteStoreChainName.trim()) {
      alert("Please enter BOTH store chain name and store address.");
      return;
    }

    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/removeStore",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeAddress: deleteStoreAddress.trim(),
            chainName: deleteStoreChainName.trim(),
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        alert("Error deleting store: " + json.error);
        return;
      }

      alert("Store deleted successfully.");

      setDeleteStoreAddress("");
      setDeleteStoreChainName("");

      fetchChains();
    } catch (err) {
      console.error(err);
      alert("Error deleting store.");
    }
  };

  return (
    <div>
      <h1>Stores</h1>
      {email && (<p>Admin signed in as: <strong>{email}</strong></p>)}
      <button onClick={LOGOUT}>Log Out</button>
      <h2>Existing Store Chains</h2>
        <ul>
          {chains.map((chain) => (
            <li key={chain.idstoreChain}>
              <strong>{chain.name}</strong> — {chain.url}
              <ul>
                {chain.stores.length === 0 && <li>No stores</li>}
                {chain.stores.map((s: any) => (
                  <li key={s.idStores}>{s.storeAddress}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      <h3>Delete a Store Chain</h3>
        <input type="text" placeholder="Enter store chain name" value={deleteName} onChange={(e) => setDeleteName(e.target.value)}
          style={{ padding: "6px", marginRight: "10px" }}/>
        <button onClick={deleteChain}
          style={{ padding: "6px 12px", background: "red", color: "white" }}>Delete Chain</button>
      <h3>Delete a Store</h3>
        <input type="text" placeholder="Store Chain Name" value={deleteStoreChainName} onChange={(e) => setDeleteStoreChainName(e.target.value)}
          style={{ padding: "6px", marginRight: "10px" }}/>
        <input type="text" placeholder="Store Address" value={deleteStoreAddress} onChange={(e) => setDeleteStoreAddress(e.target.value)}
          style={{ padding: "6px", marginRight: "10px" }}/>
        <button onClick={deleteStore}
          style={{ padding: "6px 12px", background: "red", color: "white" }}>Delete Store</button>
    </div>
  );
}
