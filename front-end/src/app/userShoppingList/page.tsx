"use client";

import { useEffect, useState } from "react";
import { detectLocal, LOGOUT, requireAuth, S3_URL } from "@/utils/auth";
import { useRouter } from "next/navigation";


export default function userShoppingList() {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const [shoppingListName, setShoppingListName] = useState("");
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);

  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) setEmail(userEmail);
    else if (detectLocal() == false) {window.location.href = `${S3_URL}`;
      return;}
    fetchShoppingLists()
  }, []);

  const handleCreateShoppingList = async () => {
    const userID = localStorage.getItem("user_id");

    if (!userID) {
      alert("User ID not found — are you logged in?");
      return;
    }

    if (!shoppingListName.trim()) {
      alert("Shopping list name required.");
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
            name: shoppingListName,
            userID: userID,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      alert("Shopping list created!");
      setShoppingListName("");

      // refresh list automatically (optional)
      fetchShoppingLists();
    } catch (err) {
      console.error("Error creating shopping list:", err);
      alert("Failed to create shopping list.");
    }
  };

  const fetchShoppingLists = async () => {
    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getShoppingLists",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userID: Number(localStorage.getItem("user_id")),
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        alert("Error: " + data.error);
        return;
      }

      setShoppingLists(data);
    } catch (err) {
      console.error("Error fetching shopping lists:", err);
      alert("Failed to fetch shopping lists.");
    }
  };
  return (
    <div>
      <h1>Shopping List</h1>
      {email && (<p>Signed in as: <strong>{email}</strong></p>)}
      <button onClick={() => router.push("/userDashboard")}>Dashboard</button>
      <hr />
      <h2>Create Shopping List</h2>
      <input type="text" placeholder="Shopping list name" value={shoppingListName}
        onChange={(e) => setShoppingListName(e.target.value)}/>
      <button onClick={handleCreateShoppingList}>Create Shopping List</button>
      <h2>Your Shopping Lists</h2>
      <ul>
        {shoppingLists.map((list) => (
          <li key={list.idshoppingList}>
            {list.name}
          </li>
        ))}
      </ul>
    </div>
  );
}