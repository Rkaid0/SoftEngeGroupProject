import { getReceipts } from "./getReceipts";

// Types based on getReceipts.ts
type ReceiptItem = {
  itemID: number;
  name: string;
  price: number;       // line or unit price (your DB)
  quantity: number;    // may be 1 if not set
  categoryID: number;
  categoryName: string;
};

type Receipt = {
  receiptID: number;
  storeID: number;
  storeAddress: string;
  date: string | Date;
  total: number;
  storeChainID: number;
  storeChainName: string;
  items: ReceiptItem[];
};

type CheapestStoreEntry = {
  categoryName: string;
  bestStoreID: number;
  bestStoreAddress: string;
  bestStoreChainID: number;
  bestStoreChainName: string;
  bestUnitPrice: number;
};

/**
 * Pure function that, given all receipts, returns the cheapest store per category.
 */
const computeCheapestStoresPerCategory = (
  receipts: Receipt[]
) => {
  // categoryID -> CheapestStoreEntry
  const map = new Map<number, CheapestStoreEntry>();

  for (const receipt of receipts) {
    const items = receipt.items || [];

    for (const item of items) {
      if (!item.categoryID || item.price == null) continue;

      const quantity =
        item.quantity && item.quantity > 0 ? item.quantity : 1;

      const unitPrice = item.price / quantity;

      const previous = map.get(item.categoryID);

      if (!previous || unitPrice < previous.bestUnitPrice) {
        map.set(item.categoryID, {
          categoryName: item.categoryName,
          bestStoreID: receipt.storeID,
          bestStoreAddress: receipt.storeAddress,
          bestStoreChainID: receipt.storeChainID,
          bestStoreChainName: receipt.storeChainName,
          bestUnitPrice: unitPrice,
        });
      }
    }
  }

  // Turn Map into a plain array for JSON
  const result = Array.from(map.entries()).map(
    ([categoryID, value]) => ({
      categoryID,
      categoryName: value.categoryName,
      bestStoreID: value.bestStoreID,
      bestStoreAddress: value.bestStoreAddress,
      bestStoreChainID: value.bestStoreChainID,
      bestStoreChainName: value.bestStoreChainName,
      bestUnitPrice: value.bestUnitPrice,
    })
  );

  return result;
};

export const handler = async (event: any) => {
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
  };

  try {
    console.log("EVENT:", JSON.stringify(event));

    const payload = JSON.parse(event.body || "{}");
    const userID = payload.userID;

    if (!userID) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing userID in request body",
        }),
      };
    }

    // 1) Load all receipts + items for this user (reusing your existing helper)
    const receipts = (await getReceipts(Number(userID))) as Receipt[];

    // 2) Compute cheapest stores per category
    const cheapest = computeCheapestStoresPerCategory(receipts);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(cheapest),
    };
  } catch (error: any) {
    console.error("ERROR:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Server error",
        details: error.message || String(error),
      }),
    };
  }
};