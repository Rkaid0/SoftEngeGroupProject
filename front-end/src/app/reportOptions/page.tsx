"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ChangeEvent } from "react";
import { detectLocal, requireAuth, S3_URL } from "@/utils/auth";

type ShoppingListItem = {
  idShoppingListItem: number;
  name: string;
  quantity: number;
  categoryID: number;
  categoryName: string;
};

type ShoppingList = {
  shoppingListID: number;
  name: string;
  items: ShoppingListItem[];
};

type CheapestCategoryEntry = {
  categoryID: number;
  categoryName: string;
  bestStoreID: number;
  bestStoreAddress: string;
  bestStoreChainID: number;
  bestStoreChainName: string;
  bestUnitPrice: number;
};

export default function ReportOptions() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [shoppingListId, setShoppingListId] = useState<number | "">("");

  const [listItems, setListItems] = useState<ShoppingListItem[]>([]);
  const [cheapestByCategory, setCheapestByCategory] = useState<CheapestCategoryEntry[]>([]);

  const [loadingCheapest, setLoadingCheapest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------- Auth + initial fetches --------------------
  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) {
      setEmail(userEmail);
    } else if (detectLocal() === false) {
      window.location.href = S3_URL;
      return;
    }

    fetchShoppingLists();
    fetchCheapestOptions();
  }, []);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("id_token")}`,
    "Content-Type": "application/json",
  });

  const userID = () => Number(localStorage.getItem("user_id"));

  // -------------------- Fetch shopping lists (with items) --------------------
  const fetchShoppingLists = async () => {
    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getShoppingLists",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            userID: userID(),
          }),
        }
      );

      const data = await res.json();
      setShoppingLists(data);
    } catch (err) {
      console.error("Error fetching shopping lists:", err);
      alert("Failed to fetch shopping lists.");
    }
  };

  // -------------------- Call /reportOptions once: cheapest per category --------------------
  const fetchCheapestOptions = async () => {
    try {
      setLoadingCheapest(true);
      setError(null);

      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/reportOptions",
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            userID: userID(),
          }),
        }
      );

      const data: CheapestCategoryEntry[] = await res.json();
      setCheapestByCategory(data);
    } catch (err) {
      console.error("Error fetching cheapest options:", err);
      setError("Failed to fetch cheapest options.");
    } finally {
      setLoadingCheapest(false);
    }
  };

  // -------------------- For a single item: look up its category --------------------
  const getOptionForItem = (categoryID: number) => {
    return cheapestByCategory.find((entry) => entry.categoryID === categoryID);
  };

  // -------------------- When a shopping list is selected --------------------
  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;

    if (value === "") {
      setShoppingListId("");
      setListItems([]);
      return;
    }

    const id = Number(value);
    setShoppingListId(id);

    const selectedList = shoppingLists.find((list) => list.shoppingListID === id);
    setListItems(selectedList?.items ?? []);
  };

  return (
    <div>
      <h1>Explore Options for Shopping List</h1>

      {email && (
        <p>
          Signed in as: <strong>{email}</strong>
        </p>
      )}
      <button onClick={() => router.push("/userDashboard")}>
        Back to Dashboard
      </button>

      <hr />

      <label>
        Select Shopping List:{" "}
        <select value={shoppingListId} onChange={handleSelectChange}>
          <option value={""}>Select Shopping List</option>
          {shoppingLists.map((list) => (
            <option key={list.shoppingListID} value={list.shoppingListID}>
              {list.name}
            </option>
          ))}
        </select>
      </label>

      {loadingCheapest && <p>Loading cheapest options…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {shoppingListId && !loadingCheapest && listItems.length > 0 && (
        <>
          <h2>Cheapest Places for Items in This List</h2>
          <table border={1} cellPadding={4}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Best Store Chain</th>
                <th>Best Store Address</th>
                <th>Best Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {listItems.map((item) => {
                const option = getOptionForItem(item.categoryID);
                return (
                  <tr key={item.idShoppingListItem}>
                    <td>{item.name}</td>
                    <td>{item.categoryName}</td>
                    <td>{item.quantity}</td>
                    <td>{option?.bestStoreChainName ?? "No data"}</td>
                    <td>{option?.bestStoreAddress ?? "No data"}</td>
                    <td>
                      {option
                        ? `$${option.bestUnitPrice.toFixed(2)}`
                        : "No data"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {shoppingListId && !loadingCheapest && listItems.length === 0 && (
        <p>No items found in this list.</p>
      )}
    </div>
  );
}
