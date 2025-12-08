"use client";
import { useEffect, useState } from "react";
import { requireAuth, S3_URL, LOGOUT, detectLocal } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  // NEW: date field
  const [date, setDate] = useState("");

  // Store Chains (loaded from Lambda)
  const [storeChains, setStoreChains] = useState<
    { idstoreChain: number; name: string; url: string }[]
  >([]);

  const [selectedStoreChainID, setSelectedStoreChainID] = useState<number | "">("");

  // Stores (loaded dynamically when chain is selected)
  const [stores, setStores] = useState<
    { idStores: number; storeAddress: string }[]
  >([]);

  const [selectedStoreID, setSelectedStoreID] = useState<number | "">("");

  // Items for this receipt
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState<number | "">("");
  const [itemCategory, setItemCategory] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editCategory, setEditCategory] = useState("");

  const [currentItems, setCurrentItems] = useState<
    { id: number; name: string; price: number; category: string }[]
  >([]);

  // ------------------------------
  // DO NOT MODIFY THIS useEffect()
  // ------------------------------
  useEffect(() => {
    const email = requireAuth();
    if (email) setEmail(email);
    else if (detectLocal() == false) {
      window.location.href = `${S3_URL}`;
    }
  }, []);

  // Load store chains on mount
  useEffect(() => {
    const fetchChains = async () => {
      try {
        const res = await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getStoreChains",
          {
            method: "GET",
            headers: {"Authorization": `Bearer ${localStorage.getItem("id_token")}`},
          }
        );
        const data = await res.json();
        setStoreChains(data);
      } catch (err) {
        console.error("Error fetching store chains:", err);
      }
    };

    fetchChains();
  }, []);

  // Load stores when a store chain is selected
  useEffect(() => {
    if (!selectedStoreChainID) {
      setStores([]);
      setSelectedStoreID("");
      return;
    }

    const fetchStores = async () => {
      try {
        const res = await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getStores",
          {
            method: "POST",
            headers: {"Authorization": `Bearer ${localStorage.getItem("id_token")}`},
            body: JSON.stringify({ storeChainID: selectedStoreChainID }),
          }
        );

        const data = await res.json();
        setStores(data);
      } catch (err) {
        console.error("Error fetching stores:", err);
      }
    };

    fetchStores();
  }, [selectedStoreChainID]);

  // ----------------------------------
  // CREATE RECEIPT + ADD ITEM LAMBDAS
  // ----------------------------------
  const handleCreateReceipt = async () => {
    if (!selectedStoreID || !date || currentItems.length === 0) {
      alert("Store, date, and at least one item are required.");
      return;
    }

    try {
      // 1. Create receipt
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createReceipt",
        {
          method: "POST",
          headers: {"Authorization": `Bearer ${localStorage.getItem("id_token")}`},
          body: JSON.stringify({
            storeID: selectedStoreID,
            date: date,
            userID: localStorage.getItem("user_id"),
          }),
        }
      );

      const data = await res.json();
      const receiptID = data.receiptID;

      if (!receiptID) {
        alert("Error creating receipt.");
        return;
      }

      // 2. Add items to this receipt
      for (const item of currentItems) {
        await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/addItemToReceipt",
          {
            method: "POST",
            headers: {"Authorization": `Bearer ${localStorage.getItem("id_token")}`},
            body: JSON.stringify({
              receiptID,
              name: item.name,
              price: item.price,
              category: item.category,
            }),
          }
        );
      }

      alert("Receipt stored successfully!");

      // Reset UI
      setSelectedStoreChainID("");
      setStores([]);
      setSelectedStoreID("");
      setDate("");
      setCurrentItems([]);

    } catch (err) {
      console.error("Error creating receipt:", err);
      alert("Receipt creation failed.");
    }
  };

  // -------------------
  // LOCAL ITEM HANDLING
  // -------------------
  const handleAddItem = () => {
    if (!itemName.trim() || itemPrice === "" || !itemCategory.trim()) return;

    const newItem = {
      id: Date.now(),
      name: itemName,
      price: Number(itemPrice),
      category: itemCategory,
    };

    setCurrentItems((prev) => [...prev, newItem]);

    setItemName("");
    setItemPrice("");
    setItemCategory("");
  };

  const handleDeleteItem = (id: number) => {
    setCurrentItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditCategory(item.category);
  };

  const handleSaveItem = () => {
    if (!editingItemId) return;

    setCurrentItems((prev) =>
      prev.map((i) =>
        i.id === editingItemId
          ? { ...i, name: editName, price: Number(editPrice), category: editCategory }
          : i
      )
    );

    setEditingItemId(null);
  };

  // -------------------
  // UI RENDER
  // -------------------
  return (
    <div>
      <h1>Dashboard</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}

      <button onClick={() => router.push("/reviewActivity")}>Review Activity</button>
      <button onClick={() => router.push("/reviewHistory")}>Review History</button>
      <button onClick={() => router.push("/userStoreGUI")}>Store GUI</button>
      <button onClick={LOGOUT}>Log Out</button>

      <hr />

      <h2>Create Receipt</h2>

      {/* Store Chain Dropdown */}
      <select
        value={selectedStoreChainID}
        onChange={(e) => setSelectedStoreChainID(Number(e.target.value))}
      >
        <option value="">Select Store Chain</option>
        {storeChains.map((chain) => (
          <option key={chain.idstoreChain} value={chain.idstoreChain}>
            {chain.name}
          </option>
        ))}
      </select>

      {/* Store Dropdown - depends on chain */}
      <select
        value={selectedStoreID}
        onChange={(e) => setSelectedStoreID(Number(e.target.value))}
        disabled={!stores.length}
      >
        <option value="">Select Store</option>
        {stores.map((store) => (
          <option key={store.idStores} value={store.idStores}>
            {store.storeAddress}
          </option>
        ))}
      </select>

      {/* Date */}
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <h3>Add Items</h3>

      <input
        type="text"
        placeholder="Item Name"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Item Price"
        value={itemPrice}
        onChange={(e) =>
          setItemPrice(e.target.value === "" ? "" : Number(e.target.value))
        }
      />

      <input
        type="text"
        placeholder="Category"
        value={itemCategory}
        onChange={(e) => setItemCategory(e.target.value)}
      />

      <button onClick={handleAddItem}>Add Item</button>

      <h4>Items in This Receipt</h4>

      {currentItems.length === 0 && <p>No items added yet.</p>}

      {currentItems.map((item) => (
        <div
          key={item.id}
          style={{ border: "1px solid #aaa", padding: "6px", marginTop: "6px" }}
        >
          {editingItemId === item.id ? (
            <>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} />
              <input
                type="number"
                value={editPrice}
                onChange={(e) =>
                  setEditPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              />
              <button onClick={handleSaveItem}>Save</button>
            </>
          ) : (
            <>
              <p><strong>{item.name}</strong> — ${item.price.toFixed(2)}</p>
              <p>Category: {item.category}</p>
              <button onClick={() => handleEditItem(item)}>Edit</button>
              <button
                onClick={() => handleDeleteItem(item.id)}
                style={{ marginLeft: "8px", background: "red", color: "white" }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      ))}

      <button onClick={handleCreateReceipt}>Submit Receipt</button>
    </div>
  );
}
