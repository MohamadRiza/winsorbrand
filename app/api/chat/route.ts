import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Retailer from '@/lib/models/Retailer';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: 'Messages array is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Gemini API Key is not configured' }, { status: 500 });
    }

    // Dynamic database lookup for active official retailers
    let retailerContext = "Official Authorized Winsor Retailers & Store Outlets:\n";
    try {
      await connectDB();
      const retailers = await Retailer.find({ isActive: true }).lean();
      if (retailers && retailers.length > 0) {
        retailers.forEach((r: any) => {
          retailerContext += `- ${r.name} | City: ${r.city} | Address: ${r.address}${r.phone ? ` | Phone: ${r.phone}` : ''}\n`;
        });
      } else {
        retailerContext += "Authorized retailers are available island-wide. Visit /retailers for live store locations.\n";
      }
    } catch (e) {
      console.error('Failed to fetch retailers for AI context:', e);
    }

    // System instruction to restrict the assistant's behavior & train on official retailers
    const systemPrompt = 
      "You are Winsi, the official Winsor Brand AI Horology Concierge. You introduce yourself as Winsi. You only answer questions related to watches, Winsor Brand, and authorized retailers. " +
      "Do not compare Winsor watches with other brands. Use only Winsor Brand details to speak and chat. " +
      "RETAILER & STORE LOCATIONS INSTRUCTIONS:\n" +
      "When users ask about official retailers, stores, store locations, where to buy, or check if a store is authorized:\n" +
      "1. Refer strictly to the Official Authorized Winsor Retailers list below to identify valid store partners.\n" +
      "2. Clearly state the official store name, city, address, and contact number.\n" +
      "3. Direct the customer to view interactive store maps, operating hours, and full details on our Store Locator page at '/retailers'.\n\n" +
      retailerContext + "\n\n" +
      "Winsor Brand Key Facts:\n" +
      "- Movement: Japan Movement (Japanese precision horology movement).\n" +
      "- Registration: Dubai/UAE Registered Brand (Trademark registered in Dubai 2023).\n" +
      "- Warranty: 1 year international warranty (100% Free First Year Servicing & Battery Replacements).\n" +
      "- Returns: Easy return within 7 days.\n" +
      "- Delivery: Free Island-Wide Shipping in Sri Lanka.\n" +
      "- Payments: 100% secure checkout with payhere.lk.\n" +
      "- Contact Email: info@winsorbrand.com\n" +
      "- Style & Materials: Luxury design, sapphire crystals, water-resistant casings, premium metal and rubber straps.\n" +
      "If the user asks any question that is not related to watches or Winsor Brand, politely decline to answer, " +
      "stating that you are only programmed to assist with watch-related, warranty, service, and Winsor Brand inquiries.";

    // Convert message history to Gemini format (excluding the static welcome message at index 0)
    // Gemini roles: 'user' and 'model'
    const formattedContents = messages.slice(1).map((m: { role: string; content: string }) => {
      const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
      return {
        role,
        parts: [{ text: m.content }]
      };
    });

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}\n\nAcknowledge these guidelines and begin the chat.` }]
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. Hello! I am Winsi, your personal Winsor Brand Horology Concierge. How may I assist you with our timepieces today?' }]
        },
        ...formattedContents
      ],
      generationConfig: {
        maxOutputTokens: 350,
        temperature: 0.2, // Low temperature to keep the AI focused and factual
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Failed to generate content from Gemini' },
        { status: response.status }
      );
    }

    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return NextResponse.json({ success: false, error: 'No response text generated' }, { status: 500 });
    }

    return NextResponse.json({ success: true, text: candidateText.trim() });
  } catch (err: unknown) {
    console.error('Chat API Error:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
