import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export const getGeminiModel = (modelName: string = "gemini-3-flash-preview") => {
  if (!genAI) {
    throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
  }
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Helper to generate text from a prompt
 */
export async function generateText(prompt: string, modelName: string = "gemini-3-flash-preview"): Promise<string> {
  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini text generation failed:", error);
    throw error;
  }
}

/**
 * Helper to generate JSON structured output from a prompt
 */
export async function generateJSON(prompt: string, modelName: string = "gemini-3-flash-preview"): Promise<any> {
  try {
    const model = getGeminiModel(modelName);
    // Explicitly ask the model to return JSON in the system instruction or configure responseMimeType
    // The newer API supports responseMimeType: "application/json"
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini JSON generation failed:", error);
    throw error;
  }
}
