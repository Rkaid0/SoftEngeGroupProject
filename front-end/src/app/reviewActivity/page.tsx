'use client'
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { detectLocal, requireAuth, S3_URL } from "@/utils/auth"

type PeriodEntry = {
  period: string;
  total: number;
  byStoreChain: Record<string, number>;
};

export default function ReviewActivity() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [byDay, setByDay] = useState<PeriodEntry[]>([]);
  const [byWeek, setByWeek] = useState<PeriodEntry[]>([]);
  const [byMonth, setByMonth] = useState<PeriodEntry[]>([]);

  useEffect(() => {
      const userEmail = requireAuth();
      if (userEmail) setEmail(userEmail);
      else if (detectLocal() == false) {window.location.href = `${S3_URL}`;
        return;}
    }, []);

  const formatYYYYMMDD = (period: string) => {
    // Handles "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ss", etc.
    return period.split("T")[0];
  };

  const fetchActivity = async (userID: any) => {
    try {
      const res = await fetch(
        "https://jwbdksbzpg.execute-api.us-east-1.amazonaws.com/prod/reviewActivity",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("id_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userID }),
        }
      );

      const data = await res.json();

      setByDay(data.byDay || []);
      setByWeek(data.byWeek || []);
      setByMonth(data.byMonth || []);

    } catch (err) {
      console.error("Error loading activity:", err);
    }
  };

  // Load Activity
  useEffect(() => {
    const userID = localStorage.getItem("user_id");
    if (!userID) return;
    fetchActivity(userID);
  }, [email]);

  const renderPeriodSection = (title: string, data: PeriodEntry[]) => (
    <>
      <h2 style={{ marginTop: "30px" }}>{title}</h2>

      {data.length === 0 && (
        <p style={{ fontStyle: "italic" }}>No data available.</p>
      )}

      {data.map((entry) => (
        <div
          key={entry.period}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginTop: "12px",
            background: "#fafafa",
            borderRadius: "6px",
          }}
        >
          <h3>{formatYYYYMMDD(entry.period)}</h3>

          <p>
            <strong>Total:</strong> ${entry.total.toFixed(2)}
          </p>

          <div style={{ marginLeft: "10px" }}>
            {Object.entries(entry.byStoreChain).map(
              ([storeChain, amount]) => (
                <p key={storeChain}>
                  {storeChain}: ${amount.toFixed(2)}
                </p>
              )
            )}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div>
      <h1>Review Activity</h1>
      {email && <p>Signed in as: <strong>{email}</strong></p>}
      <button onClick={() => router.push("/userDashboard")}>Back to Dashboard</button>
      <hr />
      {renderPeriodSection("Monthly Spending", byMonth)}
      {renderPeriodSection("Weekly Spending", byWeek)}
      {renderPeriodSection("Daily Spending", byDay)}
    </div>
  )
}