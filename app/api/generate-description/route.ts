// app/api/generate-description/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory cache
const cache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Fallback template generator in case Gemini API is rate-limited or key has expired
const generateFallback = (title: string, modelNo: string, watchShape: string, price: number) => {
  const formattedPrice = price ? `LKR ${price.toLocaleString()}` : '';
  return `Introducing the Winsor ${title} (Model: ${modelNo}). Masterfully crafted to embody timeless sophistication, this exquisite timepiece features a distinguished ${watchShape.toLowerCase()} silhouette. Every detail, from the pristine dial finish to the precision-engineered movement, reflects our commitment to horological excellence. Offered at ${formattedPrice}, it stands as a statement of luxury and refined taste, designed for the modern connoisseur who values both style and performance.`;
};

export async function POST(req: NextRequest) {
  try {
    const { title, modelNo, watchShape, price, thumbnailUrl } = await req.json();
    
    const cacheKey = `${title}-${modelNo}-${thumbnailUrl ? 'withImage' : 'noImage'}`;
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ description: cached.response, cached: true });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Using luxurious template fallback.');
      const fallbackDesc = generateFallback(title, modelNo, watchShape, price);
      return NextResponse.json({ 
        description: fallbackDesc, 
        cached: false, 
        warning: 'API key not configured. Generated template description.' 
      });
    }

    // 1. Fetch the image and convert to base64 if available
    let imagePart = null;
    if (thumbnailUrl) {
      try {
        const imgRes = await fetch(thumbnailUrl);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          
          let mimeType = 'image/jpeg';
          if (thumbnailUrl.toLowerCase().endsWith('.png')) mimeType = 'image/png';
          else if (thumbnailUrl.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';
          
          imagePart = {
            inlineData: {
              mimeType,
              data: base64
            }
          };
        }
      } catch (err) {
        console.error('Failed to fetch image for Gemini analysis:', err);
      }
    }

    // 2. Build multimodal prompt
    const prompt = `Generate a luxurious, compelling product description for a premium watch.
${imagePart ? 'Please analyze the provided image of the watch to describe its specific visual features (e.g., dial texture, color scheme, indices, bezel style, strap/bracelet finish, and metal highlights) accurately.' : ''}
Details:
- Title: ${title}
- Model: ${modelNo}
- Shape: ${watchShape}
- Price: LKR ${price?.toLocaleString()}

Write a sophisticated 150-200 word description highlighting craftsmanship, design highlights, precision, and elegance. Use persuasive language suitable for a high-end luxury brand. Do not start with generic greetings.`;

    const parts: any[] = [{ text: prompt }];
    if (imagePart) {
      parts.push(imagePart);
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Gemini API request failed:', errorData);
      
      // Gratefully fallback to local template generator
      const fallbackDesc = generateFallback(title, modelNo, watchShape, price);
      return NextResponse.json({
        description: fallbackDesc,
        cached: false,
        warning: 'Gemini API limit reached. Generated template description instead.'
      });
    }

    const data = await res.json();
    const description = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!description) {
      const fallbackDesc = generateFallback(title, modelNo, watchShape, price);
      return NextResponse.json({ 
        description: fallbackDesc, 
        cached: false,
        warning: 'Gemini response empty. Generated template description.'
      });
    }

    // Cache the result
    cache.set(cacheKey, { response: description, timestamp: Date.now() });

    return NextResponse.json({ description, cached: false });

  } catch (error: any) {
    console.error('Generate description error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}