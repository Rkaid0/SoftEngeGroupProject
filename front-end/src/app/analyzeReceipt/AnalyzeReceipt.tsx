import OpenAI from "openai";
import React, { useState } from "react";

export const OPENAI_API_KEY = "PUT API KEY HERE"; // ⚠ demo only, not for prod

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // required in browser environments
});

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

const jsonPrompt = `
You are a strict JSON API that extracts structured data from store receipts.

Return ONLY valid JSON, with this exact shape:

{
  "receipt": {
    "merchant_name": string | null,
    "merchant_address": string | null,
    "purchase_date": string | null,
    "total": number | null,
    "items": Array<{
      "name": string,
      "category": string,
      "quantity": number | null,
      "unit_price": number | null
    }>
  }
}

Rules:
- If you can't find a field, set it to null.
- Monetary values are numbers only (no currency symbols).
- Do NOT include any extra fields.
- Do NOT add any explanation text outside the JSON.
`.trim();

export default function AnalyzeReceipt() {
  const [parsedReceipt, setParsedReceipt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadReceipt = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      console.log("Please upload an image file (jpg, png, etc.)");
      return;
    }

    try {
      setIsLoading(true);
      setParsedReceipt("");

      // 1. Convert image file to base64 data URL
      const dataUrl = await readFileAsDataURL(file);

      // 2. Call OpenAI Responses API directly from the browser
      const response = await openai.responses.create({
        model: "gpt-4.1-mini", // vision-capable & cheap
        input: [{
            role: "user",
            content: [
              { type: "input_text", text: jsonPrompt },
              {
                type: "input_image",
                image_url: dataUrl,
                detail: "auto"
              }
            ]
          }
        ],
        text: {
          format: { type: "json_object" },
        },
        max_output_tokens: 2048,
      });

      // 3. Get the combined text output and parse as JSON
      const jsonText = response.output_text;
      const parsed = JSON.parse(jsonText);

      setParsedReceipt(parsed.receipt);
    } catch (err) {
      console.error(err);
      console.log("Failed to parse receipt. Try another image or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, padding: 16 }}>
      <h2>Upload store receipt</h2>

      <input type="file" accept="image/*" onChange={handleUploadReceipt} />

      {isLoading && <p>Analyzing receipt…</p>}

      {parsedReceipt && (
        <>
          <h3>Parsed receipt JSON</h3>
          <pre
            style={{
              background: "#111",
              color: "#0f0",
              padding: 12,
              borderRadius: 8,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(parsedReceipt, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
};