'use client';
import { useEffect, useState } from "react";
import { requireAuth, S3_URL, LOGOUT } from "@/utils/auth";

export default function UserDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("")
  const [store, setStore] = useState("")
  const [itemName, setItemName] = useState("")
  const [itemPrice, setItemPrice] = useState<number | "">("")
  const [itemCategory, setItemCategory] = useState("")
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState<number | "">("")
  const [editCategory, setEditCategory] = useState("")
  const [receipts, setReceipts] = useState<
    { id: number; name: string; store: string; items: { id: number; name: string; price: number; category: string }[] }[]>([])
  const [currentItems, setCurrentItems] = useState<
    { id: number; name: string; price: number; category: string }[]>([])

  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) setEmail(userEmail);
    else {window.location.href = `${S3_URL}`;
      return;}
  }, []);

  const handleCreateReceipt = () => {
    if (name.trim() === "" || store.trim() === "") return

    const newReceipt = {
      id: Date.now(),
      name,
      store,
      items: currentItems,
    }
    setReceipts(prev => [...prev, newReceipt])

    setName("")
    setStore("")
    setCurrentItems([])
  }

  const handleAddItem = () => {
    if (!itemName.trim() || itemPrice === "" || !itemCategory.trim()) return

    const newItem = {
      id: Date.now(),
      name: itemName,
      price: Number(itemPrice),
      category: itemCategory,
    }

    setCurrentItems(prev => [...prev, newItem])

    setItemName("")
    setItemPrice("")
    setItemCategory("")
  }

  const handleDeleteReceipt = (id: number) => {
    setReceipts(prev => prev.filter(r => r.id !== id))
  }
  const handleDeleteItem = (id: number) => {
    setCurrentItems(prev => prev.filter(item => item.id !== id))
  }
  const handleEditItem = (item: { id: number; name: string; price: number; category: string }) => {
    setEditingItemId(item.id)
    setEditName(item.name)
    setEditPrice(item.price)
    setEditCategory(item.category)
  }
  const handleSaveItem = () => {
    if (!editingItemId) return;

    setCurrentItems(prev =>
      prev.map(item =>
        item.id === editingItemId
          ? { ...item, name: editName, price: Number(editPrice), category: editCategory }
          : item
      )
    );

      setEditingItemId(null);
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {email && (
        <p>Signed in as: <strong>{email}</strong></p>
      )}
      <button onClick={() => window.location.href = `${S3_URL}/reviewActivity`}>Review Activity</button>
      <button onClick={() => window.location.href = `${S3_URL}/reviewHistory`}>Review History</button>
      <button onClick={() => window.location.href = `${S3_URL}/userStoreGUI`}>Store GUI</button>
      <button onClick={LOGOUT}>Log Out</button>
      <hr />
      <h2>Create Receipt</h2>
      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)}/>
      <input type="text" placeholder="Store" value={store} onChange={e => setStore(e.target.value)}/>
      <h3>Add Items</h3>
      <input type="text" placeholder="Item Name" value={itemName} onChange={e => setItemName(e.target.value)}/>
      <input type="number" placeholder="Item Price" value={itemPrice} onChange={e => setItemPrice(e.target.value === "" ? "" : Number(e.target.value))}/>
      <input type="text" placeholder="Category" value={itemCategory} onChange={e => setItemCategory(e.target.value)}/>
      <button onClick={handleAddItem}>Add Item</button>
      <h4>Items in This Receipt</h4>
      {currentItems.length === 0 && <p>No items added yet.</p>}
      {currentItems.map(item => (
        <div key={item.id}
            style={{ border: "1px solid #aaa", padding: "6px", marginTop: "6px" }}>

          {editingItemId === item.id ? (
            <>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Item Name"/>
              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Item Price"/>
              <input type="text" value={editCategory} onChange={e => setEditCategory(e.target.value)} placeholder="Category"/>
              <button onClick={handleSaveItem}>Save</button>
            </>
          ) : (
            <>
              <p><strong>{item.name}</strong> — ${item.price.toFixed(2)}</p>
              <p>Category: {item.category}</p>
              <button onClick={() => handleEditItem(item)}>Edit</button>
              <button onClick={() => handleDeleteItem(item.id)} style={{ marginLeft: "8px", background: "red", color: "white" }}>Remove </button>
            </>
          )}
        </div>
      ))}
      <button onClick={handleCreateReceipt}>Create Receipt</button>
      <h3>Receipts</h3>
      {receipts.map(receipt => (
        <div key={receipt.id}
             style={{ border: "2px solid #333", padding: "10px", marginTop: "12px" }}>
          <h4>{receipt.name} — {receipt.store}
            <button onClick={() => handleDeleteReceipt(receipt.id)}>Delete</button>
          </h4>
          {receipt.items.map(item => (
            <div key={item.id}
                 >
              <p>
                <strong>{item.name}</strong> — ${item.price.toFixed(2)}
                <br />
                Category: {item.category}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
