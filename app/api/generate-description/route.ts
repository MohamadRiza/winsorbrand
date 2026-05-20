// app/api/generate-description/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache (use Redis in production)
const cache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function POST(req: NextRequest) {
  try {
    const { title, modelNo, watchShape, price } = await req.json();
    
    const cacheKey = `${title}-${modelNo}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ description: cached.response, cached: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const prompt = `Generate a luxurious, compelling product description for a premium watch:
- Title: ${title}
- Model: ${modelNo}
- Shape: ${watchShape}
- Price: LKR ${price?.toLocaleString()}

Write a sophisticated 150-200 word description highlighting craftsmanship, elegance, precision, and luxury. Use persuasive language suitable for a high-end watch brand.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
        }),
      }
    );

    if (res.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to generate description' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!description) {
      return NextResponse.json({ error: 'No description generated' }, { status: 500 });
    }

    // Cache the result
    cache.set(cacheKey, { response: description, timestamp: Date.now() });

    return NextResponse.json({ description, cached: false });

  } catch (error: any) {
    console.error('Generate description error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}