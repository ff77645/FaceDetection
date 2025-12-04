import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Remove header if present (data:image/jpeg;base64,)
    const cleanBase64 = base64Image.split(',')[1];

    const prompt = "Analyze the face in this image. Describe the person's appearance, their facial expression, and the overall sentiment of the image.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "A brief physical description of the person."
            },
            expression: {
              type: Type.STRING,
              description: "The specific facial expression detected (e.g., smiling, frowning, neutral)."
            },
            sentiment: {
              type: Type.STRING,
              description: "One word sentiment summary (e.g., Happy, Serious, Concerned)."
            }
          },
          required: ["description", "expression", "sentiment"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini analysis error:", error);
    throw new Error("Failed to analyze image");
  }
};
