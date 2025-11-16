// server.js

// Part 1: Load our tools
require('dotenv').config(); // This MUST be the first line to load .env variables
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require("@google/genai");

// Part 2: Basic Server Setup
const app = express();
const port = 3001;
app.use(cors());
app.use(express.json()); // IMPORTANT: This allows us to read the data sent from the frontend

// Part 3: Securely Initialize the Gemini AI
// Check for the API Key first from the .env file
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set. Please check your .env file.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


// Part 4: Create the AI Generation Endpoint
// This is the new URL our frontend will call
app.post('/api/generate-reply', async (req, res) => {
  try {
    // Get the data the frontend sent to us in the request body
    const { email, businessInfo, tone } = req.body;

    // Basic check to make sure we received the data
    if (!email || !businessInfo || !tone) {
      return res.status(400).json({ error: 'Missing required data: email, businessInfo, or tone' });
    }

    // --- THIS IS THE EXACT SAME AI LOGIC FROM YOUR FRONTEND'S geminiService.ts FILE ---
    const model = 'gemini-2.5-flash';

    const knowledgeBase = businessInfo
      .filter(item => item.key && item.key.trim() && item.value && item.value.trim())
      .map(item => `- ${item.key.trim()}: ${item.value.trim()}`)
      .join('\n');
    
    const systemInstruction = `You are an expert customer support agent. Your goal is to write clear, concise, and helpful email replies in a ${tone.toLowerCase()} tone. Use the following business information as your knowledge base to answer customer questions. Be professional and empathetic.

  **Business Information Knowledge Base:**
  ${knowledgeBase || 'No business information provided.'}`;

    const prompt = `Please draft a reply to the following customer email.

  **From:** ${email.sender} <${email.senderEmail}>
  **Subject:** ${email.subject}
  
  **Email Body:**
  ---
  ${email.body}
  ---
  
  Based on the business information, provide a suitable response.`;
    // --- END OF COPIED LOGIC ---

    // Now, we securely call the Gemini API from our backend
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        topP: 0.95,
      }
    });
    
    // Send the AI's generated reply back to the frontend
    res.json({ reply: response.text.trim() });

  } catch (error) {
    console.error("Error in /api/generate-reply endpoint:", error);
    // Send a generic error message back to the frontend
    res.status(500).json({ error: 'Failed to generate AI reply on the server.' });
  }
});


// Part 5: Start the server
app.listen(port, () => {
  console.log(`Backend server is now running with AI capabilities on http://localhost:${port}`);
});