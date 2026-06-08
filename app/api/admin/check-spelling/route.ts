// app/api/admin/check-spelling/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  let text = '';
  try {
    const body = await req.json().catch(() => ({}));
    text = body.text || '';

    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: 'Text is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Spell check bypass.');
      return NextResponse.json({ 
        success: true,
        errorsFound: false,
        originalText: text,
        correctedText: text,
        errorDetails: 'API key not configured'
      });
    }

    const prompt = `Analyze the following text from our luxury watch store admin panel. Check for any spelling, capitalization, grammar, or minor mistyping errors.
If there are no errors, set "errorsFound" to false. If there are errors, correct them and set "errorsFound" to true, and provide a brief explanation of the correction.
Do not rewrite style or change context, only correct spelling, typos, and obvious grammatical mistakes.

Text to verify:
"${text}"

Return ONLY a JSON object in this exact format, with no markdown code blocks, backticks or extra text:
{
  "originalText": "original text here",
  "correctedText": "corrected text here",
  "errorsFound": true/false,
  "errorDetails": "brief explanation of mistakes found"
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error('Gemini API request failed:', errorData);
      return NextResponse.json({ 
        success: true,
        errorsFound: false,
        originalText: text,
        correctedText: text,
        errorDetails: 'Gemini request failed',
        warning: 'AI spelling check is offline. Please verify text manually.'
      });
    }

    const data = await res.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up Markdown JSON wrapper if returned
    if (responseText.includes('```')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    try {
      const result = JSON.parse(responseText.trim());
      return NextResponse.json({ 
        success: true, 
        errorsFound: result.errorsFound,
        originalText: result.originalText || text,
        correctedText: result.correctedText || text,
        errorDetails: result.errorDetails || ''
      });
    } catch (parseErr) {
      console.error('Failed to parse Gemini response:', responseText, parseErr);
      return NextResponse.json({ 
        success: true,
        errorsFound: false,
        originalText: text,
        correctedText: text,
        errorDetails: 'Could not parse response',
        warning: 'AI spelling check returned an invalid response. Please verify manually.'
      });
    }

  } catch (error: any) {
    console.error('Spell check API error:', error);
    return NextResponse.json({ 
      success: true,
      errorsFound: false,
      originalText: text,
      correctedText: text,
      errorDetails: 'Gemini request failed',
      warning: 'AI spelling check is offline. Please verify text manually.'
    });
  }
}
