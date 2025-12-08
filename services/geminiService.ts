import { GoogleGenAI, Type } from "@google/genai";
import { Expense, ExpenseCategory, ReceiptData } from "../types";

// Initialize Gemini Client
// Note: In a real app, ensure process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

export const parseReceiptImage = async (base64Image: string): Promise<ReceiptData> => {
  if (!base64Image) throw new Error("No image data provided");

  // Remove data URL prefix if present for the API call logic if needed, 
  // but standard usage often accepts the base64 part.
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG/PNG conversion handled by input
              data: base64Data,
            },
          },
          {
            text: `Analyze this receipt image. Extract the Merchant Name, Date (YYYY-MM-DD), Total Amount, and categorize it into one of these: [Food, Transport, Travel, Utilities, Entertainment, Health, Shopping, Other]. 
            
            Return JSON only.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            date: { type: Type.STRING, description: "YYYY-MM-DD format" },
            amount: { type: Type.NUMBER },
            category: { 
              type: Type.STRING, 
              enum: [
                "Food", "Transport", "Travel", "Utilities", "Entertainment", "Health", "Shopping", "Other"
              ]
            }
          },
          required: ["merchant", "amount", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    
    // Fallbacks if AI misses required fields slightly
    return {
      merchant: data.merchant || "Unknown Merchant",
      amount: typeof data.amount === 'number' ? data.amount : 0,
      date: data.date || new Date().toISOString().split('T')[0],
      category: (data.category as ExpenseCategory) || ExpenseCategory.Other,
    };

  } catch (error) {
    console.error("Receipt parsing error:", error);
    throw new Error("Failed to parse receipt. Please try manually.");
  }
};

export const generateInsights = async (expenses: Expense[]): Promise<string> => {
  if (!expenses.length) return "No expenses to analyze.";

  // Prepare a summary payload to save tokens
  const simplifiedExpenses = expenses.map(e => ({
    date: e.date,
    category: e.category,
    amount: e.amount,
    merchant: e.merchant
  })).slice(0, 100); // Limit to last 100 for performance/limits

  const prompt = `
    Analyze this list of expenses and provide a helpful, human-readable summary.
    Identify:
    1. The category with the highest spending.
    2. Any unusual spending patterns.
    3. A brief tip for saving money based on this data.
    
    Keep it concise (max 3 sentences).
    Data: ${JSON.stringify(simplifiedExpenses)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    
    return response.text || "Could not generate insights.";
  } catch (error) {
    console.error("Insight generation error:", error);
    return "Unable to generate insights at this time.";
  }
};