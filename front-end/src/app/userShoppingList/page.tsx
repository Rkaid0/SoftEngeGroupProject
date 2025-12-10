"use client";

import { useEffect, useState } from "react";
import { detectLocal, LOGOUT, requireAuth, S3_URL } from "@/utils/auth";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "johnsshops3733@gmail.com";

export default function AdminDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const [shoppingListName, setShoppingListName] = useState("");
  const [shoppingListUserID, setShoppingListUserID] = useState("");

  const handleCreateShoppingList = async () => {
    if (!shoppingListName.trim() || !shoppingListUserID.trim()) {
      alert("Enter both userID and list name.");
      return;
    }
    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/createShoppingList",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: Number(shoppingListUserID),
            name: shoppingListName,
          }),
        }
      );

      const data = await res.json();
      console.log("Shopping list created:", data);

      alert("Shopping list created!");

      setShoppingListName("");
      setShoppingListUserID("");
    } catch (err) {
      console.error("Error creating shopping list:", err);
      alert("Failed to create shopping list.");
    }
  };
  useEffect(() => {
    const userEmail = requireAuth();
    if (detectLocal() == true) {
      return;
    }
    if (!userEmail) window.location.href = `${S3_URL}`;

    if (userEmail !== ADMIN_EMAIL) {
      window.location.href = `${S3_URL}/userDashboard`;
      return;
    }
    setEmail(userEmail);
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {email && (<p>Signed in as: <strong>{email}</strong></p>)}
      <button onClick={() => router.push("/adminStoreGUI")}>Store GUI</button>
      <button onClick={LOGOUT}>Log Out</button>
      <h2>Create Shopping List</h2>
      <input type="text" placeholder="User ID" value={shoppingListUserID}
        onChange={(e) => setShoppingListUserID(e.target.value)}/>
      <input type="text" placeholder="Shopping List Name" value={shoppingListName}
        onChange={(e) => setShoppingListName(e.target.value)}/>
      <button onClick={handleCreateShoppingList}>Create Shopping List</button>
    </div>
  );
}
