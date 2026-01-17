
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

/**
 * Generates a strategic business response from the Gemini model based on the provided inventory and sales data.
 * This function processes the business state and user query to return actionable professional advice.
 * 
 * @param prompt - The specific question or area of concern from the user.
 * @param products - The current catalog of products and their stock levels.
 * @param sales - The history of transactions to analyze trends.
 * @returns A promise resolving to the AI-generated advice string.
 */
export async function getAdvisorChatResponse(prompt: string, products: Product[], sales: Sale[]): Promise<string> {
  // Initialize the client inside the function to ensure it uses the most up-to-date environment variables
  // and avoids crashes during module loading if process is undefined.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // We prepare a concise summary of the business data to provide context to the model while remaining efficient.
  const inventorySummary = products.slice(0, 15).map(p => ({
    name: p.name,
    sku: p.sku,
    stock: p.hasVariants ? p.variants?.reduce((sum, v) => sum + v.stockLevel, 0) : p.stockLevel,
    price: p.sellingPrice,
    cost: p.costPrice
  }));

  const salesSummary = sales.slice(0, 10).map(s => ({
    date: s.date,
    total: s.totalAmount,
    profit: s.profit,
    items: s.items.map(i => i.productName).join(', ')
  }));

  const messageContent = `
    Business Context for TheDécorHub (High-end Decor Retailer):
    NOTE: All currency values are in Bangladeshi Taka (BDT / ৳).
    
    Current Inventory Snapshot:
    ${JSON.stringify(inventorySummary, null, 2)}
    
    Recent Sales Trends:
    ${JSON.stringify(salesSummary, null, 2)}
    
    User Query:
    "${prompt}"
  `;

  try {
    // Using gemini-3-pro-preview for complex reasoning and business analysis tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: messageContent,
      config: {
        systemInstruction: "You are a world-class senior business strategy advisor specializing in luxury retail and home decor in the South Asian market. Analyze the provided ERP data (in BDT currency) to offer insightful, professional, and data-driven recommendations. Focus on inventory efficiency, margin optimization, and sales growth.",
        temperature: 0.7,
      },
    });

    // Access the .text property directly to retrieve the generated string.
    return response.text || "I apologize, but I was unable to generate a strategic analysis for this query.";
  } catch (error) {
    // Log error for system maintenance and provide a graceful fallback message.
    console.error("Gemini Advisor API Error:", error);
    return "I'm currently unable to access my strategic analysis models. Please ensure your system state is synchronized and try again.";
  }
}
