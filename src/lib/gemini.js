import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Switch to "gemini-1.5-flash" (The standard, stable version)
const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });


export { model };