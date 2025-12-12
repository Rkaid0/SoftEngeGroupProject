'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { detectLocal, requireAuth, S3_URL } from "@/utils/auth"

export default function ReviewHistory() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [existingReceipts, setExistingReceipts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
      const userEmail = requireAuth();
      if (userEmail) setEmail(userEmail);
      else if (detectLocal() == false) {window.location.href = `${S3_URL}`;
        return;}
  }, []);

  const fetchReceipts = async (userID : any) => {
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

  const filteredReceipts = existingReceipts.filter((receipt) => {
    // If no search text, show everything
    if (!searchTerm.trim()) return true;

    // If receipt has no items, it cannot match
    if (!receipt.items || receipt.items.length === 0) return false;

    // Check if ANY item name contains the search term
    return receipt.items.some((item: any) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  //UI RENDER  
  return (
    <div>
      <h1>Review History</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
    {/* ---------------------------
          EXISTING RECEIPTS UI
         --------------------------- */}
      <hr />
      <h2>Existing Receipts</h2>
      <div style={{ marginTop: "16px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search receipts by item name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "8px 10px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </div>
      {existingReceipts.length === 0 && <p>No receipts found.</p>}
      {filteredReceipts.length === 0 && searchTerm && existingReceipts.length !== 0 && (
        <p style={{ fontStyle: "italic" }}>
          No receipts match your search.
        </p>
      )}


        {filteredReceipts.map((receipt: any) => (
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
  )
}