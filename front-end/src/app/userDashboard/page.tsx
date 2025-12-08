"use client";
import { useEffect, useState } from "react";
import { requireAuth, S3_URL, LOGOUT, detectLocal } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  const [date, setDate] = useState("");

  const [storeChains, setStoreChains] = useState<
    {
      idstoreChain: number;
      name: string;
      url: string;
      stores: { idStores: number; storeAddress: string }[];
    }[]
  >([]);

  const [selectedStoreChainID, setSelectedStoreChainID] = useState<number | "">("");
  const [selectedStoreID, setSelectedStoreID] = useState<number | "">("");

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

  const [existingReceipts, setExistingReceipts] = useState<any[]>([]);

  useEffect(() => {
    const email = requireAuth();
    if (email) setEmail(email);
    else if (detectLocal() == false) {
      window.location.href = `${S3_URL}`;
    }
  }, []);

  useEffect(() => {
    const fetchChains = async () => {
      try {
        const res = await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getStoreChains",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${localStorage.getItem("id_token")}` },
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

  // ------------------------------------------------
  // FIXED RECEIPTS LOAD — Correct item detection
  // ------------------------------------------------
  useEffect(() => {
    const userID = localStorage.getItem("user_id");
    if (!userID) return;

    const fetchReceipts = async () => {
      try {
        const res = await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getReceipts",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("id_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userID }),
          }
        );

        const rows = await res.json();

        // FIX: Lambda already returns grouped receipts
        const cleaned = rows.map((r: any) => ({
          ...r,
          date: r.date?.split("T")[0] // remove time part
        }));

        setExistingReceipts(cleaned);

      } catch (err) {
        console.error("Error loading receipts:", err);
      }
    };

    fetchReceipts();
  }, [email]);

  // ----------------------------------
  // CREATE RECEIPT + ADD ITEMS
  // ----------------------------------
  const handleCreateReceipt = async () => {
    if (!selectedStoreID || !date || currentItems.length === 0) {
      alert("Store, date, and at least one item are required.");
      return;
    }

    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createReceipt",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json",
          },
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

      for (const item of currentItems) {
        await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/addItemToReceipt",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("id_token")}`,
              "Content-Type": "application/json",
            },
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

      setSelectedStoreChainID("");
      setSelectedStoreID("");
      setDate("");
      setCurrentItems([]);
    } catch (err) {
      console.error("Error creating receipt:", err);
      alert("Receipt creation failed.");
    }
  };

  // -------------------
  // LOCAL ITEMS
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
        onChange={(e) => {
          setSelectedStoreChainID(Number(e.target.value));
          setSelectedStoreID("");
        }}
      >
        <option value="">Select Store Chain</option>
        {storeChains.map((chain) => (
          <option key={chain.idstoreChain} value={chain.idstoreChain}>
            {chain.name}
          </option>
        ))}
      </select>

      {/* Store Dropdown */}
      <select
        value={selectedStoreID}
        onChange={(e) => setSelectedStoreID(Number(e.target.value))}
        disabled={
          !selectedStoreChainID ||
          !storeChains.find((c) => c.idstoreChain === selectedStoreChainID)?.stores?.length
        }
      >
        <option value="">Select Store</option>
        {selectedStoreChainID &&
          storeChains
            .find((c) => c.idstoreChain === selectedStoreChainID)
            ?.stores.map((store) => (
              <option key={store.idStores} value={store.idStores}>
                {store.storeAddress}
              </option>
            ))}
      </select>

      {/* Date */}
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

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
              <p>
                <strong>{item.name}</strong> — ${item.price.toFixed(2)}
              </p>
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

      {/* ---------------------------
          EXISTING RECEIPTS UI
         --------------------------- */}
      <hr />
      <h2>Existing Receipts</h2>

      {existingReceipts.length === 0 && <p>No receipts found.</p>}

        {existingReceipts.map((receipt: any) => (
          <div
            key={receipt.receiptID}
            style={{
              border: "2px solid #444",
              padding: "12px",
              marginTop: "18px",
              background: "#fafafa",
              borderRadius: "6px",
            }}
          >
            <h3>
              Receipt from {receipt.storeAddress}
              <span style={{ marginLeft: "10px", fontSize: "14px", color: "#666" }}>
                (Store ID: {receipt.storeID})
              </span>
            </h3>

            <p>
              <strong>Date:</strong> {receipt.date?.split("T")[0]}
            </p>

            {(!receipt.items || receipt.items.length === 0) ? (
              <p style={{ fontStyle: "italic" }}>No items in this receipt.</p>
            ) : (
              <div style={{ marginTop: "10px" }}>
                {receipt.items.map((item: any) => (
                  <div
                    key={item.itemID}
                    style={{
                      border: "1px solid #bbb",
                      padding: "8px",
                      marginTop: "8px",
                      background: "white",
                      borderRadius: "4px",
                    }}
                  >
                    <p>
                      <strong>{item.name}</strong> — ${Number(item.price).toFixed(2)}
                    </p>
                    <p>
                      Category: {item.categoryName} (ID {item.categoryID})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
