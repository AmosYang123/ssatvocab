const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

/**
 * Scores a user's writing answer against the correct definition and synonyms using Groq AI.
 * Falls back to offline logic if API fails or takes > 5s.
 */
export async function scoreWritingAnswerAI(
    userInput: string,
    definition: string,
    synonyms: string[],
    throwOnError: boolean = false,
    modelId: string = "llama-3.3-70b-versatile"
): Promise<boolean | null> {
    if (!API_KEY) {
        if (throwOnError) console.warn("scoreWritingAnswerAI: No Groq API Key found.");
        return null;
    }
    if (!navigator.onLine) return null;

    const prompt = `Task: Score vocab answer.
Word Definition: "${definition}"
Valid Synonyms: ${synonyms.join(", ")}
Student Answer: "${userInput}"

Rules:
1. Respond ONLY "CORRECT" if the student answer matches the meaning or is a valid synonym.
2. Respond ONLY "INCORRECT" otherwise.
3. Ignore minor spelling/grammar.
4. ONE WORD RESPONSE ONLY.`;

    try {
        // 3 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: "system", content: "You are a vocabulary scoring assistant. Respond with ONLY 'CORRECT' or 'INCORRECT'." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 5
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            console.error("[Groq API Error]", response.status, errBody);
            return null;
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim().toUpperCase() || "";

        if (text.includes("CORRECT") && !text.includes("INCORRECT")) {
            console.log(`[Groq] Score SUCCESS: ${text}`);
            return true;
        }
        if (text.includes("INCORRECT") && !text.includes("CORRECT")) {
            console.log(`[Groq] Score SUCCESS: ${text}`);
            return false;
        }

        console.warn(`[Groq] Ambiguous response: "${text}"`);
        return null;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            console.warn("[Groq] Request timed out (5s).");
        } else {
            console.error("[Groq Service Error]", err.message || err);
        }
        return null;
    }
}
