"use client";
import { useEffect, useState } from "react";
import { requireAuth, S3_URL, LOGOUT, detectLocal } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();

  // NEW: date field
  const [date, setDate] = useState("");

  // NEW: store list + mapping
  const storeMap: Record<string, number> = {
    "Walmart": 1,
    "Target": 2,
    "Safeway": 3,
    "Costco": 4,
    "Amazon": 5,
    "Trader Joe's": 6
  };

  const [storeList] = useState<string[]>(Object.keys(storeMap));
  const [selectedStoreID, setSelectedStoreID] = useState<number | "">("");

  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState<number | "">("");
  const [itemCategory, setItemCategory] = useState("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editCategory, setEditCategory] = useState("");

  // items for the receipt
  const [currentItems, setCurrentItems] = useState<
    { id: number; name: string; price: number; category: string }[]
  >([]);

  // DO NOT MODIFY
  useEffect(() => {
    const email = requireAuth();
    if (email) setEmail(email);
    else if (detectLocal() == false) {
      window.location.href = `${S3_URL}`;
    }
  }, []);

  // -----------------------------
  // CREATE RECEIPT -> LAMBDA CALL
  // -----------------------------
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
            userID: localStorage.getItem("user_id")
          })
        }
      );

      const data = await res.json();
      const receiptID = data.receiptID;

      if (!receiptID) {
        alert("Error creating receipt.");
        return;
      }

      // 2. Add items to receipt
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
              category: item.category
            })
          }
        );
      }

      alert("Receipt stored successfully!");

      // Reset UI
      setSelectedStoreID("");
      setDate("");
      setCurrentItems([]);

    } catch (err) {
      console.error("Error creating receipt:", err);
      alert("Receipt creation failed.");
    }
  };

  // --------------------------------
  // LOCAL ITEM HANDLING (NO CHANGES)
  // --------------------------------
  const handleAddItem = () => {
    if (!itemName.trim() || itemPrice === "" || !itemCategory.trim()) return;

    const newItem = {
      id: Date.now(),
      name: itemName,
      price: Number(itemPrice),
      category: itemCategory
    };

    setCurrentItems(prev => [...prev, newItem]);

    setItemName("");
    setItemPrice("");
    setItemCategory("");
  };

  const handleDeleteItem = (id: number) => {
    setCurrentItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditItem = (item: {
    id: number;
    name: string;
    price: number;
    category: string;
  }) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditCategory(item.category);
  };

  const handleSaveItem = () => {
    if (!editingItemId) return;

    setCurrentItems(prev =>
      prev.map(item =>
        item.id === editingItemId
          ? {
              ...item,
              name: editName,
              price: Number(editPrice),
              category: editCategory
            }
          : item
      )
    );

    setEditingItemId(null);
  };

  // -------------------
  // UI
  // -------------------
  return (
    <div>
      <h1>Dashboard</h1>
      {email && (
        <p>
          Signed in as: <strong>{email}</strong>
        </p>
      )}

      <button onClick={() => router.push("/reviewActivity")}>
        Review Activity
      </button>
      <button onClick={() => router.push("/reviewHistory")}>
        Review History
      </button>
      <button onClick={() => router.push("/userStoreGUI")}>Store GUI</button>
      <button onClick={LOGOUT}>Log Out</button>

      <hr />

      <h2>Create Receipt</h2>

      {/* Store dropdown */}
      <select
        value={selectedStoreID}
        onChange={e => setSelectedStoreID(Number(e.target.value))}
      >
        <option value="">Select Store</option>
        {storeList.map(storeName => (
          <option key={storeName} value={storeMap[storeName]}>
            {storeName}
          </option>
        ))}
      </select>

      {/* Date input */}
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        placeholder="YYYY-MM-DD"
      />

      <h3>Add Items</h3>

      <input
        type="text"
        placeholder="Item Name"
        value={itemName}
        onChange={e => setItemName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Item Price"
        value={itemPrice}
        onChange={e =>
          setItemPrice(e.target.value === "" ? "" : Number(e.target.value))
        }
      />

      <input
        type="text"
        placeholder="Category"
        value={itemCategory}
        onChange={e => setItemCategory(e.target.value)}
      />

      <button onClick={handleAddItem}>Add Item</button>

      <h4>Items in This Receipt</h4>
      {currentItems.length === 0 && <p>No items added yet.</p>}

      {/* Item list */}
      {currentItems.map(item => (
        <div
          key={item.id}
          style={{ border: "1px solid #aaa", padding: "6px", marginTop: "6px" }}
        >
          {editingItemId === item.id ? (
            <>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
              <input
                type="number"
                value={editPrice}
                onChange={e =>
                  setEditPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <input
                value={editCategory}
                onChange={e => setEditCategory(e.target.value)}
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
    </div>
  );
}
