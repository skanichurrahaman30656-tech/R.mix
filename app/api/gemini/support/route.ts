import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: "You are R.mix AI Support Assistant, a friendly, helpful expert on the R.mix social media, video, and reel sharing platform. Assist users with questions about uploading videos, managing creator profiles, analytics, likes, comments, and troubleshooting."
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (err: any) {
    console.error("Support chat error:", err);
    return NextResponse.json({ error: err.message || 'Support chat failed' }, { status: 500 });
  }
}
