"use client";
import { useEffect, useState } from "react";
import { requireAuth, S3_URL, LOGOUT, detectLocal } from "@/utils/auth";
import { useRouter } from "next/navigation";
import AnalyzeReceipt from "../analyzeReceipt/AnalyzeReceipt"

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
  const [itemQuantity, setItemQuantity] = useState<number | "">("");
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editQuantity, setEditQuantity] = useState<number | "">("");
  const [editCategory, setEditCategory] = useState("");
  
  const today = new Date();
  const getWeekDates = (): string[] => {
    // Calculate the date of the first day of the week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - 7);
    const endOfWeek = new Date(today);

    const weekDates: string[] = [];
    weekDates.push(startOfWeek.toISOString().split('T')[0].replaceAll("-", "/"));
    weekDates.push(endOfWeek.toISOString().split('T')[0].replaceAll("-", "/"));

    return weekDates;
  };

  const [currentItems, setCurrentItems] = useState<
    { id: number; name: string; price: number; quantity: number; category: string }[]
  >([]);

  const [existingReceipts, setExistingReceipts] = useState<any[]>([]);

  const [categories, setCategories] = useState<
    { categoryID: number; name: string }[]
  >([]);

  const [itemCategory, setItemCategory] = useState<string>("");  // user’s selected OR new input
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewStoreChain, setIsNewStoreChain] = useState(false);
  const [newStoreChainName, setNewStoreChainName] = useState("");
  const [newStoreChainURL, setNewStoreChainURL] = useState("");
  const [isNewStore, setIsNewStore] = useState(false);
  const [newStoreAddress, setNewStoreAddress] = useState("");

  const [apiKey, setApiKey] = useState<string>("");
  const [apiKeyIsSet, setApiKeyIsSet] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("API_KEY");
    if (stored) {
      setApiKey(stored);
      setApiKeyIsSet(true);
    }
  }, []);

  useEffect(() => {
    const email = requireAuth();
    if (email) setEmail(email);
    else if (detectLocal() == false) {
      window.location.href = `${S3_URL}`;
    }
  }, []);

  const handleReceiptParsed = (receipt: any) => {
    const newItems = receipt.items.map((item: any) => ({
      id: generateNumericId(),
      name: item.name,
      price: item.unit_price,
      category: item.category,
      quantity: item.quantity
    }));

    setCurrentItems((prev) => [...prev, ...newItems]);

    if (receipt.purchase_date) {
      const [mm, dd, yyyy] = receipt.purchase_date.split("/");
      if (mm && dd && yyyy) {
        setDate(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`);
      }
    }

    const correspondingChain = storeChains.find((chain) => chain.name === receipt.merchant_name);
    if (!correspondingChain) {
      setIsNewStoreChain(true);
      setNewStoreChainName(receipt.merchant_name);
    }
    else setSelectedStoreChainID(correspondingChain.idstoreChain);

    const correspondingStore = correspondingChain 
      ? correspondingChain.stores.find((store) => store.storeAddress === receipt.merchant_address)
      : null;
    if (correspondingStore == null) {
      setIsNewStore(true);
      setNewStoreAddress(receipt.merchant_address);
    }
    else setSelectedStoreID(correspondingStore.idStores);
  }
  
  const fetchCategories = async () => {
      try {
        const res = await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getCategories",
          {
            method: "GET",
            headers: { Authorization: `Bearer ${localStorage.getItem("id_token")}` }
          }
        );

        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

  useEffect(() => {
    fetchCategories();
  }, []);

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

  useEffect(() => {
    fetchChains();
  }, []);

  const createStoreChain = async() => {
    try { const res = await fetch(
            "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createStoreChain",{
              method: "POST", 
              headers: {"Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("id_token")}` }, 
              body: JSON.stringify({
                  name: newStoreChainName,
                  url: newStoreChainURL
              })
            } 
        )
        const data = await res.json();
        return(data.storeChainID)
    }
    catch (err) {console.error("Error creating store chain:", err)}
  }

  const createStore = async (storeChainID : number) => {  
    try {
        if (!storeChainID) {
          alert("Store Chain creation error.");
          return;
        }
        const res = await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createStore",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("id_token")}`
            },
            body: JSON.stringify({
              storeAddress: newStoreAddress,
              storeChainID: storeChainID
            })
          }
        );
        const data = await res.json();
        return data.storeID;
      } catch (err) {
        console.error("Error creating store:", err)
      }
    }

  const fetchReceipts = async (userID : any) => {
    try {
        const res = await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getReceiptsTimeFrame",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("id_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userID, startDate : getWeekDates()[0], endDate : getWeekDates()[1]}),
          }
        );

        const rows = await res.json();

        const cleaned = rows.map((r: any) => ({
          ...r,
          date: r.date?.split("T")[0] // remove time part
        }));

        setExistingReceipts(cleaned);

      } catch (err) {
        console.error("Error loading receipts:", err);
      }
    };

  // Load Receipts
  useEffect(() => {
    const userID = localStorage.getItem("user_id");
    if (!userID) return;
    fetchReceipts(userID);
  }, [email]);

  // CREATE RECEIPT + ADD ITEMS
  const handleCreateReceipt = async () => {
    if (!selectedStoreID && isNewStore === false || !date || currentItems.length === 0) {
      alert("Store, date, and at least one item are required.");
      return;
    }

    let storeChainID = Number(selectedStoreChainID);
    let storeID = selectedStoreID;

    if (isNewStoreChain) {
      storeChainID = await createStoreChain();
    }

    if (isNewStore) {
      storeID = await createStore(storeChainID);
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
            storeID: storeID,
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
              quantity: item.quantity,
              category: item.category,
            }),
          }
        );
      }

      alert("Receipt stored successfully!");
      fetchReceipts(localStorage.getItem("user_id"));
      fetchCategories();

      setSelectedStoreChainID("");
      setIsNewStore(false);
      setIsNewStoreChain(false);
      setNewStoreAddress("");
      setNewStoreChainName("");
      setNewStoreChainURL("");
      setSelectedStoreID("");
      setDate("");
      setCurrentItems([]);
    } catch (err) {
      console.error("Error creating receipt:", err);
      alert("Receipt creation failed.");
    }
  };

  const handleDeleteReceipt = async (receiptID : any) => {
    const confirm = window.confirm("Are you sure you want to delete this receipt? This cannot be undone.");
    if (!confirm) return;
    await fetch(
          "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/deleteReceipt",
      {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("id_token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
            receiptID: receiptID,
            userID: localStorage.getItem("user_id"),
        }),
      }
    );

    fetchReceipts(localStorage.getItem("user_id"));
  }

  let itemCounter = 0;

  function generateNumericId() {
    return Date.now() * 1000 + (itemCounter++ % 1000);
  }

  // LOCAL ITEMS
  const handleAddItem = () => {
    if (!itemName.trim() || itemPrice === "" || !itemCategory.trim()) return;

    const newItem = {
      id: generateNumericId(),
      name: itemName,
      price: Number(itemPrice),
      quantity: Number(itemQuantity),
      category: itemCategory,
    };

    setCurrentItems((prev) => [...prev, newItem]);

    setItemName("");
    setItemPrice("");
    setItemCategory("");
    setItemQuantity("");
  };

  const handleDeleteItem = (id: number) => {
    setCurrentItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditCategory(item.category);
    setEditQuantity(item.quantity)
  };

  const handleSaveItem = () => {
    if (!editingItemId) return;

    setCurrentItems((prev) =>
      prev.map((i) =>
        i.id === editingItemId
          ? { ...i, name: editName, price: Number(editPrice), category: editCategory, quantity: Number(editQuantity) }
          : i
      )
    );

    setEditingItemId(null);
  };

  // UI RENDER
  return (
    <div>
      <h1>Dashboard</h1>
      {email && <p>Welcome, <strong>{email}</strong> </p>}

      <button onClick={() => router.push("/reviewActivity")}>Review Activity</button>
      <button onClick={() => router.push("/reviewHistory")}>Review History</button>
      <button onClick={() => router.push("/userStoreGUI")}>Stores</button>
      <button onClick={() => router.push("/userShoppingList")}>Shopping List</button>
      <button onClick={() => router.push("/reportOptions")}>Shopping List Options</button>
      <button onClick={LOGOUT}>Log Out</button>

      <hr />

      <h2>Create Receipt</h2>

      {/* STORE CHAIN DROPDOWN */}
      <select
        value={isNewStoreChain ? "new" : selectedStoreChainID}
        onChange={(e) => {
          if (e.target.value === "new") {
            setIsNewStoreChain(true);
            setSelectedStoreChainID("");
            setSelectedStoreID("");
          } else {
            setIsNewStoreChain(false);
            setSelectedStoreChainID(Number(e.target.value));
            setSelectedStoreID("");
          }
        }}
      >
        <option value="">Select Store Chain</option>

        {storeChains.map((chain) => (
          <option key={chain.idstoreChain} value={chain.idstoreChain}>
            {chain.name}
          </option>
        ))}

        <option value="new">+ Create new store chain…</option>
      </select>

      {/* New Store Chain Input */}
      {isNewStoreChain && (
        <input
          type="text"
          placeholder="New store chain name"
          value={newStoreChainName}
          onChange={(e) => setNewStoreChainName(e.target.value)}
        />
      )}
      {isNewStoreChain && (
        <input
          type="text"
          placeholder="New store chain URL"
          value={newStoreChainURL}
          onChange={(e) => setNewStoreChainURL(e.target.value)}
        />
      )}

      {/* STORE DROPDOWN */}
        <select
          value={isNewStore ? "new" : selectedStoreID}
          onChange={(e) => {
            if (e.target.value === "new") {
              setIsNewStore(true);
              setSelectedStoreID("");
            } else {
              setIsNewStore(false);
              setSelectedStoreID(Number(e.target.value));
            }
          }}
          disabled={!selectedStoreChainID && !isNewStoreChain}
        >
          <option value="">Select Store</option>

          {!isNewStoreChain &&
            selectedStoreChainID &&
            storeChains
              .find((c) => c.idstoreChain === selectedStoreChainID)
              ?.stores.map((store) => (
                <option key={store.idStores} value={store.idStores}>
                  {store.storeAddress}
                </option>
              ))}

          <option value="new">+ Create new store…</option>
        </select>

        {/* New Store Input */}
        {isNewStore && (
          <input
            type="text"
            placeholder="New store address"
            value={newStoreAddress}
            onChange={(e) => setNewStoreAddress(e.target.value)}
          />
        )}


      {/* Date */}
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

      <h3>Add Items</h3>

      <input
        id="receiptNameInput"
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
        type="number"
        min="1"
        placeholder="Item Quantity"
        style={{ width: '100px' }}
        value={itemQuantity}
        onChange={(e) =>
          setItemQuantity(e.target.value === "" ? "" : Number(e.target.value))
        }
      />

      {/* CATEGORY DROPDOWN */}
      <select
        value={isNewCategory ? "new" : itemCategory}
        onChange={(e) => {
          if (e.target.value === "new") {
            setIsNewCategory(true);
            setItemCategory("");
          } else {
            setIsNewCategory(false);
            setItemCategory(e.target.value);
          }
        }}
      >
        <option value="">Select Category</option>
        
        {categories.map((cat) => (
          <option key={cat.categoryID} value={cat.name}>
            {cat.name}
          </option>
        ))}

        <option value="new">+ Create new category…</option>
      </select>

      {/* SHOW INPUT WHEN CREATING NEW CATEGORY */}
      {isNewCategory && (
        <input
          type="text"
          placeholder="Enter new category name"
          value={itemCategory}
          onChange={(e) => setItemCategory(e.target.value)}
        />
      )}

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
              <input value={editName} placeholder="Item Name" onChange={(e) => setEditName(e.target.value)} />
              <input
                type="number"
                value={editPrice}
                placeholder="Item Price"
                onChange={(e) =>
                  setEditPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <input
                type="number"
                min="1"
                placeholder="Item Quantity"
                style={{ width: '100px' }}
                value={editQuantity}
                onChange={(e) =>
                  setEditQuantity(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
              <input
                value={editCategory}
                placeholder="Item Category"
                onChange={(e) => setEditCategory(e.target.value)}
              />
              <button onClick={handleSaveItem}>Save</button>
            </>
          ) : (
            <>
              <p>
                <strong>{item.name}</strong> — ${item.price.toFixed(2)} x{item.quantity}
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
      <hr />
      {apiKeyIsSet ? <AnalyzeReceipt apiKey = { apiKey } handler = { handleReceiptParsed }/> : (
        <><h2>Analyze Receipt With AI</h2>
          <input placeholder="Enter API key" onChange={(e) => setApiKey(e.target.value)}/>
          <button onClick={() => {localStorage.setItem("API_KEY", apiKey); setApiKey(apiKey); setApiKeyIsSet(true)}}>Submit Key</button>
        </>
      )}
      {/* ---------------------------
          EXISTING RECEIPTS UI
         --------------------------- */}
      <hr />
      <h2>This Week's Receipts</h2> <p> <strong>{getWeekDates()[0]} - {getWeekDates()[1]}</strong> </p>

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
              Receipt from {receipt.storeChainName} at {receipt.storeAddress}
              <span style={{ marginLeft: "10px", fontSize: "14px", color: "#666" }}>
                (Store ID: {receipt.storeID})
              </span>
              <button 
              onClick={() => handleDeleteReceipt(receipt.receiptID)}
              style={{ marginLeft: "8px", background: "red", color: "white" }}
                >
                  Delete
                </button>
            </h3>

            <p>
              <strong>Date:</strong> {receipt.date}
              <strong> Total: </strong> ${Number(receipt.total).toFixed(2)}
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
                      <strong>{item.name}</strong> — ${Number(item.price).toFixed(2)} x{Number(item.quantity)}
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
