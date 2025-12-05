// app/api/gemini/chat/route.ts
import { NextResponse } from "next/server";
import { GeminiService } from "@/utils/lib/geminiService";

export async function POST(req: Request) {
  try {
    const { userMessage, productContext } = await req.json();

    const aiText = await GeminiService.chatGenerateDescription(
      userMessage,
      productContext
    );

    return NextResponse.json({ reply: aiText });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "AI request failed" },
      { status: 500 }
    );
  }
}
