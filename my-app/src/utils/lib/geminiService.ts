// utils/lib/geminiService.ts (SERVER VERSION)
import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private static getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API key is not configured in .env.local");
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
