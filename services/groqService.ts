const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const IMPORT_API_KEY = import.meta.env.VITE_IMPORT_API_KEY || API_KEY || "";

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
            console.warn("[Groq] Request timed out (3s).");
        } else {
            console.error("[Groq Service Error]", err.message || err);
        }
        return null;
    }
}

/**
 * Expands a list of words with definitions, synonyms, and example sentences.
 */
export async function expandWordsAI(
    words: { name: string, definition?: string }[],
    modelId: string = "llama-3.3-70b-versatile"
): Promise<any[]> {
    if (!IMPORT_API_KEY || !navigator.onLine || words.length === 0) return [];

    const prompt = `Task: SSAT/ISEE Vocabulary Enrichment Engine.
Objective: Clean, complete, and elevate the following raw vocabulary entries.

INPUT DATA (Word Name + optionally provided context/definition):
${words.map(w => `- [NAME]: "${w.name}" | [GIVEN_CONTEXT]: "${w.definition || "None"}"`).join("\n")}

Requirements for EACH word:
1. "name": Return the word name exactly as provided.
2. "definition": Provide a high-level, precise academic definition. If GIVEN_CONTEXT is present, incorporate its meaning but elevate the vocabulary.
3. "synonyms": 3-4 sophisticated synonyms appropriate for standardized testing (SSAT/SAT).
4. "example": A single, high-quality contextual sentence (15-25 words). Avoid generic "He is [word]" or "She feels [word]" structures. Context should be literary, historical, or academic.
5. "difficulty": Choose one: "basic", "easy", "medium", "hard" (based on 8th-12th grade test frequency).

MANDATORY OUTPUT FORMAT:
Respond with ONLY a clean JSON array of objects. Do not include markdown code blocks, preamble, or any other text.

EXAMPLE:
[
  { "name": "Enmity", "definition": "a state of deep-seated ill will or mutual hatred", "synonyms": "animosity, antagonism, rancor, hostility", "example": "The decades of enmity between the rival noble houses finally culminated in a violent conflict that devastated the entire region.", "difficulty": "hard" }
]`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased timeout for higher quality demand

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${IMPORT_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: modelId,
                messages: [
                    { role: "system", content: "You are an elite SSAT/SAT Verbal Tutor. You respond ONLY with valid JSON arrays." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.2, // Lower temperature for more consistent parsing
                max_tokens: 2500
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "[]";

        // Strip non-json noise if any
        if (content.includes("[")) {
            content = content.substring(content.indexOf("["), content.lastIndexOf("]") + 1);
        }

        return JSON.parse(content);
    } catch (err) {
        console.error("[Groq expandWordsAI Error]", err);
        return [];
    }
}
