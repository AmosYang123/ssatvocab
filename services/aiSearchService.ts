import { GoogleGenerativeAI } from "@google/generative-ai";
import { Word } from '../types';

// Try to find the key in various common env vars
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_AI_KEY || "";
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export async function searchWordsByMeaning(query: string, availableWords: Word[]): Promise<Word[]> {
    if (!genAI || !API_KEY) {
        console.warn("AI Search: No Gemini API Key found.");
        return [];
    }

    if (!query.trim() || availableWords.length === 0) return [];

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // We'll send a simplified list to save tokens
        const simplifiedList = availableWords.map(w => `${w.name}: ${w.definition}`).join("\n");

        // Security: Sanitize and truncate query to prevent injection/abuse
        const safeQuery = query.replace(/"/g, '\\"').slice(0, 100);

        const prompt = `
        Task: Find vocabulary words from the provided list that strictly match the user's search query by meaning, definition, or strong synonymy.
        
        User Query: "${safeQuery}"
        
        Source List:
        ${simplifiedList}
        
        Instructions:
        1. Return ONLY a JSON array of word names that match.
        2. Order by relevance (best match first).
        3. Limit to max 5 results.
        4. If no good matches are found, return empty array [].
        5. Respond with ONLY JSON. No markdown.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean markdown code blocks if present
        if (text.includes("```json")) {
            text = text.split("```json")[1].split("```")[0];
        } else if (text.includes("```")) {
            text = text.split("```")[1].split("```")[0];
        }

        const matchedNames: string[] = JSON.parse(text);

        // Filter the original list to return full word objects
        return availableWords.filter(w => matchedNames.includes(w.name));

    } catch (error) {
        console.error("AI Search Error:", error);
        return [];
    }
}
