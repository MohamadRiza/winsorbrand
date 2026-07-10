import { NextResponse } from 'next/server';

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

    // System instruction to restrict the assistant's behavior
    const systemPrompt = 
      "You are the official Winsor Brand AI Assistant. You only answer questions related to watches and Winsor Brand. " +
      "Do not compare Winsor watches with other brands. Use only Winsor Brand details to speak and chat. " +
      "Winsor Brand Key Facts:\n" +
      "- Movement: Japan Movement (Japanese precision horology movement).\n" +
      "- Registration: Dubai/UAE Registered Brand.\n" +
      "- Warranty: 1 Year International Warranty (covers Sri Lanka and UAE).\n" +
      "- Shipping: Free Shipping within UAE and Sri Lanka.\n" +
      "- Returns: Easy 7-day returns.\n" +
      "- Payments: Secure, trusted, and verified payment gateways.\n" +
      "- Style & Materials: Luxury design, sapphire crystals, water-resistant casings, premium metal and rubber straps.\n" +
      "If the user asks any question that is not related to watches or Winsor Brand, politely decline to answer, " +
      "stating that you are only programmed to assist with watch-related and Winsor Brand inquiries.";

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
          parts: [{ text: 'Understood. I am your Winsor Brand Horology Concierge. How may I assist you with our timepieces today?' }]
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
