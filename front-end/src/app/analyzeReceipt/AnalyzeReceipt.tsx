import OpenAI from "openai";
import React, { useState } from "react";

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

const jsonPrompt = `
You are a strict JSON API that extracts structured data from grocery store receipts.
For the category item enter a general category like milk, water, apples, bread.
For the item name enter the specific item like Hood 1% Milk. Use normal capitalization.

Return ONLY valid JSON, with this exact shape:

{
  "receipt": {
    "merchant_name": string,
    "merchant_address": string | null,
    "purchase_date": string | null,
    "total": number,
    "items": Array<{
      "name": string,
      "category": string,
      "quantity": number,
      "unit_price": number
    }>
  }
}

Rules:
- Monetary values are numbers only (no currency symbols).
- Do NOT include any extra fields.
- Do NOT add any explanation text outside the JSON.
`.trim();

export default function AnalyzeReceipt({ apiKey, handler }: {apiKey: string; handler:(a: any) => void}) {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // required in browser environments
  });

  const [parsedReceipt, setParsedReceipt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadReceipt = async ( event: React.ChangeEvent<HTMLInputElement> ) => {
    console.log("Handling Upload");
    
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

      console.log(JSON.stringify(parsed.receipt))

      setParsedReceipt(parsed.receipt);

      handler(parsed.receipt);

    } catch (err) {
      console.error(err);
      console.log("Failed to parse receipt. Try another image or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
        <br/>
        <h2>Upload store receipt</h2>

        <input type="file" accept="image/*" onChange={handleUploadReceipt} />

        {isLoading ? <p>Loading...</p> : <></>}
    </div>
  );
};