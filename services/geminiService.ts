import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Scores a user's writing answer against the correct definition and synonyms.
 * Falls back to offline logic if API fails or takes > 3s.
 */
export async function scoreWritingAnswerAI(
    userInput: string,
    definition: string,
    synonyms: string[],
    throwOnError: boolean = false,
    modelId: string = "gemini-1.5-flash"
): Promise<boolean | null> {
    if (!API_KEY || !navigator.onLine) return null;

    try {
        const model = genAI.getGenerativeModel({ model: modelId });

        const prompt = `
      Task: Score a student's vocabulary answer.
      Correct Definition: "${definition}"
      Synonyms: ${synonyms.join(", ")}
      Student's Answer: "${userInput}"

      Instructions:
      1. If the student's answer correctly captures the core meaning of the definition or is a valid synonym, respond with "CORRECT".
      2. If it is wrong or unrelated, respond with "INCORRECT".
      3. Respond ONLY with "CORRECT" or "INCORRECT".
    `;

        // 3 second timeout
        const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 3000)
        );

        const resultPromise = (async () => {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim().toUpperCase();
            // Use regex to find exact word CORRECT and not INCORRECT
            const isCorrect = /\bCORRECT\b/.test(text);
            const isIncorrect = /\bINCORRECT\b/.test(text);
            return isCorrect && !isIncorrect;
        })();

        const winner = await Promise.race([resultPromise, timeoutPromise]);
        return winner;
    } catch (err) {
        if (throwOnError) throw err;
        return null; // Fallback to offline
    }
}
