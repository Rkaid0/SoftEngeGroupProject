"use client";
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { detectLocal, requireAuth, S3_URL } from "@/utils/auth"

export default function ReportOptions () {
    const router = useRouter();
    const [email, setEmail] = useState<string | null>(null);
    const [shoppingLists, setShoppingLists] = useState<any[]>([]);
    const [shoppingListId, setShoppingListId] = useState<number | "">("");

    useEffect(() => {
          const userEmail = requireAuth();
          if (userEmail) setEmail(userEmail);
          else if (detectLocal() == false) {window.location.href = `${S3_URL}`;
            return;}
      }, []);

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

    return (
        <div>
            <h1>Explore Options for Shopping List</h1>
            {email && <p>Signed in as: <strong>{email}</strong></p>}
            <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>

            <hr />

            <select value={shoppingListId}>
                <option value={""}>Select Shopping List</option>
                {shoppingLists.map((list) => (
                    <option key={list.shoppingListID} value={list.shoppingListID}>{list.name}</option>
                ))}
            </select>
        </div>
    );
}