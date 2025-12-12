"use client";

import { useEffect, useState } from "react";
import { detectLocal, LOGOUT, requireAuth, S3_URL } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function UserShoppingList() {
  const router = useRouter();

  const [email, setEmail] = useState<string | null>(null);
  const [shoppingListName, setShoppingListName] = useState("");

  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [selectedListID, setSelectedListID] = useState<number | "">("");

  const [listItems, setListItems] = useState<any[]>([]);

  // New item fields
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState<number | "">("");
  const [itemCategory, setItemCategory] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [categories, setCategories] = useState<
    { categoryID: number; name: string }[]
  >([]);

  // Load user + lists
  useEffect(() => {
    const userEmail = requireAuth();
    if (userEmail) {
      setEmail(userEmail);
    } else if (!detectLocal()) {
      window.location.href = S3_URL;
      return;
    }

    fetchShoppingLists();
    fetchCategories();
  }, []);

  // -----------------------------------------
  // FETCH CATEGORIES
  // -----------------------------------------
  const fetchCategories = async () => {
    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/getCategories",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${localStorage.getItem("id_token")}` },
        }
      );

      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // -----------------------------------------
  // FETCH SHOPPING LISTS (Option B format)
  // -----------------------------------------
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

      setShoppingLists(data);
    } catch (err) {
      console.error("Error fetching shopping lists:", err);
      alert("Failed to fetch shopping lists.");
    }
  };

  // -----------------------------------------
  // CREATE SHOPPING LIST
  // -----------------------------------------
  const handleCreateShoppingList = async () => {
    const userID = localStorage.getItem("user_id");

    if (!shoppingListName.trim()) return alert("Shopping list name required.");

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
            userID,
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
      fetchShoppingLists();
    } catch (err) {
      console.error("Error creating shopping list:", err);
      alert("Failed to create shopping list.");
    }
  };

  // -----------------------------------------
  // SELECT LIST → loads items already returned from Option B API
  // -----------------------------------------
  const handleSelectList = (list: any) => {
    setSelectedListID(list.shoppingListID);
    setListItems(list.items || []);
  };

  // -----------------------------------------
  // ADD ITEM TO LIST
  // -----------------------------------------
  const handleAddItem = async () => {
    if (!selectedListID) return alert("Select a shopping list first.");
    if (!itemName.trim() || !itemQuantity || !itemCategory.trim())
      return alert("Please fill all item fields.");

    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/addItemToShoppingList",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            shoppingListID: selectedListID,
            name: itemName,
            quantity: Number(itemQuantity),
            category: itemCategory,
          }),
        }
      );

      const data = await res.json();

      if (data.error) {
        alert("Error adding item: " + data.error);
        return;
      }

      // Update front-end list
      setListItems((prev) => [
        ...prev,
        {
          itemID: data.idShoppingListItem,
          name: itemName,
          quantity: Number(itemQuantity),
          categoryID: data.categoryID,
          categoryName: itemCategory,
        },
      ]);

      // Reset inputs
      setItemName("");
      setItemQuantity("");
      setItemCategory("");
      fetchShoppingLists()
      setIsNewCategory(false);
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item.");
    }
  };
  const handleDeleteItem = async (idShoppingListItem: number) => {
    if (!selectedListID) return alert("Select a shopping list first.");

    try {
      const res = await fetch("https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/removeItemFromShoppingList", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("id_token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shoppingListID: selectedListID,
          idShoppingListItem: idShoppingListItem,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert("Error deleting item: " + data.error);
        return;
      }

      // Update front-end list by removing the deleted item
      setListItems((prevItems) => prevItems.filter((item) => item.idShoppingListItem !== idShoppingListItem));
      alert("Item deleted successfully.");
      fetchShoppingLists()
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item.");
    }
  };
  interface Item {
    idShoppingListItem: number;
    name: string;
    quantity: number;
    categoryID: number;
    categoryName: string;
  }
  return (
    <div>
      <h1>Shopping Lists</h1>

      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>

      <hr />

      {/* ---------------- CREATE SHOPPING LIST ---------------- */}
      <h2>Create Shopping List</h2>

      <input
        type="text"
        placeholder="Shopping list name"
        value={shoppingListName}
        onChange={(e) => setShoppingListName(e.target.value)}
      />
      <button onClick={handleCreateShoppingList}>Create</button>
      <hr />
      {/* ---------------- SHOW LISTS ---------------- */}
      <h2>Your Shopping Lists</h2>

      {shoppingLists.length === 0 ? (
        <p>No shopping lists found.</p>
      ) : (
        <ul>
          {shoppingLists.map((list) => (
            <li key={list.shoppingListID} style={{ marginBottom: "20px" }}>
              {/* Display the shopping list name next to the button */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ marginRight: "10px" }}>
                  <strong>{list.name}</strong>
                </span>
                <button onClick={() => handleSelectList(list)}>Edit List</button>
              </div>

              {/* Check if there are items in the list and render them */}
              {list.items && list.items.length > 0 ? (
                <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
                  {list.items.map((item: Item) => (
                    <li key={item.idShoppingListItem}>
                      <strong>{item.name}</strong> × {item.quantity} (Category: {item.categoryName})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No items in this list</p> // If no items, show this message
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ---------------- SELECTED LIST + ADD ITEMS ---------------- */}
      {selectedListID && (
        <>
          <hr />
          <h2>Add Item</h2>

          <input
            type="text"
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />

          <input
            type="number"
            placeholder="Quantity"
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

          {isNewCategory && (
            <input
              type="text"
              placeholder="New category name"
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
            />
          )}

          <button onClick={handleAddItem}>Add</button>

          {/* ------------ DISPLAY ITEMS IN LIST ------------ */}
          <h3>Items in This List</h3>

          {listItems.length === 0 ? (
            <p>No items yet.</p>
          ) : (
            listItems.map((item) => (
              <div
                key={item.idShoppingListItem}
                style={{
                  border: "1px solid #aaa",
                  padding: "6px",
                  marginTop: "6px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p>
                    <strong>{item.name}</strong> × {item.quantity}
                  </p>
                  <p>Category: {item.categoryName}</p>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteItem(item.itemID)} // Call delete function
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
