// utils/lib/geminiService.ts (CLIENT VERSION)
// ⚠️ SECURITY NOTE: Gemini API key will be exposed client-side.
// For production, consider using API key restrictions in Google Cloud Console
// or using a proxy service to protect your API key.
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private static getGenAI() {
    // Use public environment variable for client-side access
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in environment variables.");
    }

    return new GoogleGenerativeAI(apiKey);
  }

  static async chatGenerateDescription(
    userMessage: string,
    productContext: any
  ): Promise<string> {
    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        You are a helpful AI assistant for the Farm2Table platform.

        PRODUCT INFO:
        - Farm: ${productContext.farmName || "Local Farm"}
        - Category: ${productContext.category || "General"}
        - Unit: ${productContext.unit || "piece"}

        USER MESSAGE:
        "${userMessage}"

        TASK:
        Generate 2–3 product description options using this format:

        OPTION 1:
        description...

        OPTION 2:
        description...

        OPTION 3:
        description...
      `;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error("Gemini Error:", error);
      // Return fallback descriptions
      return `
OPTION 1:
A fresh product sourced from ${
        productContext.farmName || "our farm"
      }, harvested with excellent quality and care.

OPTION 2:
Farm-fresh goodness perfect for daily meals, offering natural flavor and quality.

OPTION 3:
Premium product available in ${
        productContext.unit || "pieces"
      }, grown and sourced with care.
      `;
    }
  }
}
