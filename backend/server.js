// server.js (Updated with the correct model name)

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/generate", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("🔴 GEMINI_API_KEY is not set in the .env file!");
    return res.status(500).json({ error: "Server configuration error: Missing API Key" });
  }

  try {
    const { prompt } = req.body;
    
    // --- THIS LINE IS THE FIX ---
    // Changed 'gemini-pro' to the newer 'gemini-1.5-flash-latest'
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    console.log("✅ Full API Response:", JSON.stringify(data, null, 2));

    if (data.error) {
        console.error("🔴 Google API Error:", data.error.message);
        return res.status(500).json({ error: data.error.message });
    }

    // --- ADDED CHECK for empty candidates array to prevent crashes ---
    if (!data.candidates || data.candidates.length === 0) {
        console.error("🔴 API responded but with no candidates. This could be a safety block.");
        return res.status(500).json({ error: "The model did not return a response. This might be due to a safety filter." });
    }

    res.json(data);

  } catch (error) {
    console.error("🔴 FATAL SERVER ERROR:", error);
    res.status(500).json({ error: "Gemini API request failed", details: error.message });
  }
});

app.listen(5000, () => console.log("✅ Backend running on http://localhost:5000"));