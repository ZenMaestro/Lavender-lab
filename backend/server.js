import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { ClerkExpressWithAuth } from "@clerk/clerk-sdk-node"; // ✅ Clerk middleware

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================================
// Health Check Endpoint
// ==========================================================
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ==========================================================
// Protected Generate Endpoint
// ==========================================================
app.post("/generate", ClerkExpressWithAuth(), async (req, res) => {
  if (!req.auth.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("🔴 GEMINI_API_KEY is not set in the .env file!");
    return res.status(500).json({ error: "Server configuration error: Missing API Key" });
  }

  try {
    const { prompt } = req.body;

    const apiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();
    console.log("✅ Full API Response:", JSON.stringify(data, null, 2));

    if (data.error) {
      console.error("🔴 Google API Error:", data.error.message);
      return res.status(500).json({ error: data.error.message });
    }

    if (!data.candidates || data.candidates.length === 0) {
      console.error("🔴 API responded but with no candidates.");
      return res.status(500).json({ error: "The model did not return a response (safety filter may have blocked it)." });
    }

    res.json(data);

  } catch (error) {
    console.error("🔴 FATAL SERVER ERROR:", error);
    res.status(500).json({ error: "Gemini API request failed", details: error.message });
  }
});

// ==========================================================
// Start Server
// ==========================================================
app.listen(5000, () =>
  console.log("✅ Backend running on http://localhost:5000")
);
