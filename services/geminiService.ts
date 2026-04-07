
import { GoogleGenAI } from "@google/genai";
import { Product, Sale, Expense, Return, PurchaseOrder } from "../types";

/**
 * Generates a strategic business response from the Gemini model based on the provided inventory and sales data.
 * This function processes the business state and user query to return actionable professional advice.
 * 
 * @param prompt - The specific question or area of concern from the user.
 * @param products - The current catalog of products and their stock levels.
 * @param sales - The history of transactions to analyze trends.
 * @returns A promise resolving to the AI-generated advice string.
 */
export async function getAdvisorChatResponseStream(prompt: string, products: Product[], sales: Sale[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.1-pro-preview',
      contents: messageContent,
      config: {
        systemInstruction: "You are a world-class senior business strategy advisor specializing in luxury retail and home decor in the South Asian market. Analyze the provided ERP data (in BDT currency) to offer insightful, professional, and data-driven recommendations. Focus on inventory efficiency, margin optimization, and sales growth.",
        temperature: 0.7,
      },
    });

    return responseStream;
  } catch (error) {
    console.error("Gemini Advisor API Error:", error);
    throw error;
  }
}

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
      model: 'gemini-3.1-pro-preview',
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

/**
 * Generates an accounting response from the Gemini model based on the provided financial data.
 */
export async function getAccountantChatResponseStream(prompt: string, sales: Sale[], expenses: Expense[], returns: Return[], purchaseOrders: PurchaseOrder[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const salesSummary = sales.slice(0, 50).map(s => ({
    date: s.date,
    total: s.totalAmount,
    profit: s.profit,
    status: s.status
  }));

  const expensesSummary = expenses.slice(0, 50).map(e => ({
    date: e.date,
    category: e.category,
    amount: e.amount,
    status: e.status
  }));

  const returnsSummary = returns.slice(0, 20).map(r => ({
    date: r.date,
    amount: r.refundAmount,
    status: r.status
  }));

  const poSummary = purchaseOrders.slice(0, 20).map(po => ({
    date: po.date,
    total: po.totalAmount,
    status: po.status
  }));

  const messageContent = `
    Business Context for TheDécorHub (High-end Decor Retailer):
    NOTE: All currency values are in Bangladeshi Taka (BDT / ৳).
    
    Recent Sales:
    ${JSON.stringify(salesSummary, null, 2)}
    
    Recent Expenses:
    ${JSON.stringify(expensesSummary, null, 2)}

    Recent Returns:
    ${JSON.stringify(returnsSummary, null, 2)}

    Recent Purchase Orders:
    ${JSON.stringify(poSummary, null, 2)}
    
    User Query:
    "${prompt}"
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.1-pro-preview',
      contents: messageContent,
      config: {
        systemInstruction: "You are a world-class senior AI Accountant specializing in retail business finance. Analyze the provided ERP financial data (in BDT currency). IMPORTANT: Be extremely concise and direct. Only answer exactly what the user asks without providing unsolicited extra information, summaries, or preamble. Keep responses brief and highly relevant to the specific query.",
        temperature: 0.2,
      },
    });

    return responseStream;
  } catch (error) {
    console.error("Gemini Accountant API Error:", error);
    throw error;
  }
}

export async function getAccountantChatResponse(prompt: string, sales: Sale[], expenses: Expense[], returns: Return[], purchaseOrders: PurchaseOrder[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const salesSummary = sales.slice(0, 50).map(s => ({
    date: s.date,
    total: s.totalAmount,
    profit: s.profit,
    status: s.status
  }));

  const expensesSummary = expenses.slice(0, 50).map(e => ({
    date: e.date,
    category: e.category,
    amount: e.amount,
    status: e.status
  }));

  const returnsSummary = returns.slice(0, 20).map(r => ({
    date: r.date,
    amount: r.refundAmount,
    status: r.status
  }));

  const poSummary = purchaseOrders.slice(0, 20).map(po => ({
    date: po.date,
    total: po.totalAmount,
    status: po.status
  }));

  const messageContent = `
    Business Context for TheDécorHub (High-end Decor Retailer):
    NOTE: All currency values are in Bangladeshi Taka (BDT / ৳).
    
    Recent Sales:
    ${JSON.stringify(salesSummary, null, 2)}
    
    Recent Expenses:
    ${JSON.stringify(expensesSummary, null, 2)}

    Recent Returns:
    ${JSON.stringify(returnsSummary, null, 2)}

    Recent Purchase Orders:
    ${JSON.stringify(poSummary, null, 2)}
    
    User Query:
    "${prompt}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: messageContent,
      config: {
        systemInstruction: "You are a world-class senior AI Accountant specializing in retail business finance. Analyze the provided ERP financial data (in BDT currency). IMPORTANT: Be extremely concise and direct. Only answer exactly what the user asks without providing unsolicited extra information, summaries, or preamble. Keep responses brief and highly relevant to the specific query.",
        temperature: 0.2,
      },
    });

    return response.text || "I apologize, but I was unable to generate an accounting analysis for this query.";
  } catch (error) {
    console.error("Gemini Accountant API Error:", error);
    return "I'm currently unable to access my accounting models. Please ensure your system state is synchronized and try again.";
  }
}
