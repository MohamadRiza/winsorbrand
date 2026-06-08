// app/api/admin/resolve-maps-link/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.trim()) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    let resolvedUrl = url.trim();

    // 1. Handle shortened URLs (maps.app.goo.gl or goo.gl/maps)
    if (resolvedUrl.includes('maps.app.goo.gl') || resolvedUrl.includes('goo.gl/maps')) {
      try {
        const redirectRes = await fetch(resolvedUrl, { method: 'HEAD', redirect: 'manual' });
        const loc = redirectRes.headers.get('location');
        if (loc) {
          resolvedUrl = loc;
        }
      } catch (err) {
        console.error('Failed to resolve redirect HEAD:', err);
      }
    }

    // 2. Fetch page HTML to extract titles and description tags
    let html = '';
    let title = '';
    let ogTitle = '';
    let ogDesc = '';
    try {
      const pageRes = await fetch(resolvedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      if (pageRes.ok) {
        html = await pageRes.text();
        
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
        const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
        
        title = titleMatch ? titleMatch[1] : '';
        ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';
        ogDesc = ogDescMatch ? ogDescMatch[1] : '';
      }
    } catch (err) {
      console.error('Failed to fetch page HTML:', err);
    }

    // 3. Extract place name and precise coordinates from the resolved URL path
    let urlParsedName = '';
    const nameMatch = resolvedUrl.match(/\/maps\/place\/([^/@]+)/);
    if (nameMatch) {
      urlParsedName = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    
    // First try the precise pin coordinates (!3d...!4d...) in URL
    const pinMatch = resolvedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (pinMatch) {
      latitude = parseFloat(pinMatch[1]);
      longitude = parseFloat(pinMatch[2]);
    } else {
      // Fallback to viewport center coordinates (@lat,lng)
      const geoMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (geoMatch) {
        latitude = parseFloat(geoMatch[1]);
        longitude = parseFloat(geoMatch[2]);
      } else {
        const queryMatch = resolvedUrl.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (queryMatch) {
          latitude = parseFloat(queryMatch[1]);
          longitude = parseFloat(queryMatch[2]);
        }
      }
    }

    // 4. Helper function to extract details natively when Gemini is unavailable
    const getFallbackData = () => {
      let parsedName = urlParsedName || ogTitle || title || '';
      parsedName = parsedName.replace(/\s*-\s*Google Maps/i, '').trim();

      let parsedAddress = ogDesc || '';
      if (parsedAddress.includes('·')) {
        const parts = parsedAddress.split('·');
        parsedAddress = parts[parts.length - 1].trim();
      }

      // Discard generic Google Maps descriptions
      if (
        parsedAddress.toLowerCase().includes('find local businesses') ||
        parsedAddress.toLowerCase().includes('google maps') ||
        parsedAddress.toLowerCase().includes('get driving directions')
      ) {
        parsedAddress = '';
      }

      let parsedCity = '';
      let parsedCountry = '';
      
      const addrLower = (parsedAddress + ' ' + parsedName).toLowerCase();
      const countriesList = [
        { name: 'Sri Lanka', keywords: ['sri lanka', 'colombo', 'kandy', 'galle', 'mahabage', 'wattala'] },
        { name: 'United States', keywords: ['usa', 'united states', 'new york', 'california'] },
        { name: 'United Kingdom', keywords: ['uk', 'united kingdom', 'london', 'manchester'] },
        { name: 'Singapore', keywords: ['singapore'] },
        { name: 'Australia', keywords: ['australia', 'sydney', 'melbourne'] },
        { name: 'Maldives', keywords: ['maldives', 'male'] },
        { name: 'United Arab Emirates', keywords: ['uae', 'dubai', 'abu dhabi'] }
      ];

      for (const item of countriesList) {
        if (item.keywords.some(kw => addrLower.includes(kw))) {
          parsedCountry = item.name;
          break;
        }
      }

      const citiesList = ['colombo', 'kandy', 'galle', 'london', 'paris', 'dubai', 'singapore', 'new york', 'sydney', 'male', 'wattala', 'mahabage'];
      for (const c of citiesList) {
        if (addrLower.includes(c)) {
          parsedCity = c.charAt(0).toUpperCase() + c.slice(1);
          break;
        }
      }

      // Special check for Wattala / Mahabage Sri Lanka
      if (addrLower.includes('mahabage') || addrLower.includes('wattala')) {
        parsedCity = 'Wattala';
        parsedCountry = 'Sri Lanka';
      }

      return {
        name: parsedName,
        address: parsedAddress,
        city: parsedCity,
        country: parsedCountry,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      };
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Using fallback metadata extractor.');
      return NextResponse.json({ 
        success: true, 
        data: getFallbackData(),
        warning: 'Gemini AI was not configured. Extracted basic details from the page.'
      });
    }

    const prompt = `We have a Google Maps location link and its metadata:
Link URL: ${resolvedUrl}
Page Title: ${title}
OG Title: ${ogTitle}
OG Description: ${ogDesc}
Extracted Place Name from URL: ${urlParsedName}
Extracted Coordinates: Lat ${latitude}, Lng ${longitude}

Your task is to identify and extract the following details for our database:
- name: Shop/Boutique Name (use the 'Extracted Place Name from URL' above if it represents the shop name, e.g. 'Thilakma Mahabage')
- address: Street Address (e.g. 'Celestial Residencies, 12 Alfred Pl')
- city: City (e.g. 'Colombo' or 'Wattala')
- country: Country (e.g. 'Sri Lanka')
- latitude: Latitude (use the coordinates above, or infer them if missing)
- longitude: Longitude (use the coordinates above, or infer them if missing)

If you are not sure about city or country, deduce them based on the address or place name (e.g. Thilakma Mahabage is located in Mahabage/Wattala, Sri Lanka).
Return ONLY a JSON object in this format, with no markdown code blocks, backticks or extra text:
{
  "name": "Shop Name",
  "address": "Street Address",
  "city": "City",
  "country": "Country",
  "latitude": 7.0215734,
  "longitude": 79.8992763
}
Ensure the latitude and longitude are numbers, not strings.`;

    let geminiRes;
    try {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 350 },
          }),
        }
      );
    } catch (fetchErr) {
      console.error('Fetch to Gemini failed:', fetchErr);
      return NextResponse.json({
        success: true,
        data: getFallbackData(),
        warning: 'AI connection failed. Extracted basic details from the page.'
      });
    }

    if (!geminiRes.ok) {
      const errJson = await geminiRes.json().catch(() => ({}));
      console.error('Gemini Maps API error:', errJson);
      return NextResponse.json({
        success: true,
        data: getFallbackData(),
        warning: 'AI quota exceeded. Extracted basic details from the page.'
      });
    }

    const data = await geminiRes.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up Markdown JSON wrapper if returned
    if (responseText.includes('```')) {
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    try {
      const parsed = JSON.parse(responseText.trim());
      
      const result = {
        name: parsed.name || urlParsedName || '',
        address: parsed.address || '',
        city: parsed.city || '',
        country: parsed.country || '',
        latitude: parsed.latitude !== undefined ? Number(parsed.latitude) : (latitude || undefined),
        longitude: parsed.longitude !== undefined ? Number(parsed.longitude) : (longitude || undefined)
      };

      return NextResponse.json({ success: true, data: result });
    } catch (parseErr) {
      console.error('Failed to parse Gemini Maps response:', responseText, parseErr);
      return NextResponse.json({
        success: true,
        data: getFallbackData(),
        warning: 'AI returned invalid data format. Extracted basic details from the page.'
      });
    }

  } catch (error: any) {
    console.error('Resolve Maps Link error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Could not connect to Google Maps to resolve link. Please check the URL and your connection.' 
    }, { status: 500 });
  }
}
