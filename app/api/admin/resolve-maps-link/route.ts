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
        } else {
          // If HEAD redirect is manual, try GET with follow
          const getRes = await fetch(resolvedUrl, { redirect: 'follow' });
          if (getRes.url) {
            resolvedUrl = getRes.url;
          }
        }
      } catch (err) {
        console.error('Failed to resolve redirect HEAD/GET:', err);
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

    // 3. Extract place name from resolved URL path
    let urlParsedName = '';
    const nameMatch = resolvedUrl.match(/\/maps\/place\/([^/@]+)/);
    if (nameMatch) {
      urlParsedName = decodeURIComponent(nameMatch[1].replace(/\+/g, ' '));
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    
    // Comprehensive Coordinate Extraction from Google Maps URL:
    // Pattern A: !3d<lat>!4d<lng>
    const pinMatch3d4d = resolvedUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    // Pattern B: !1d<lng>!2d<lat> (common in directions & place links)
    const pinMatch1d2d = resolvedUrl.match(/!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)/);
    // Pattern C: !2d<lng>!3d<lat>
    const pinMatch2d3d = resolvedUrl.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/);
    // Pattern D: @<lat>,<lng>
    const geoMatch = resolvedUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    // Pattern E: q=<lat>,<lng> or ll=<lat>,<lng>
    const queryMatch = resolvedUrl.match(/(?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (pinMatch1d2d) {
      longitude = parseFloat(pinMatch1d2d[1]);
      latitude = parseFloat(pinMatch1d2d[2]);
    } else if (pinMatch3d4d) {
      latitude = parseFloat(pinMatch3d4d[1]);
      longitude = parseFloat(pinMatch3d4d[2]);
    } else if (pinMatch2d3d) {
      longitude = parseFloat(pinMatch2d3d[1]);
      latitude = parseFloat(pinMatch2d3d[2]);
    } else if (geoMatch) {
      latitude = parseFloat(geoMatch[1]);
      longitude = parseFloat(geoMatch[2]);
    } else if (queryMatch) {
      latitude = parseFloat(queryMatch[1]);
      longitude = parseFloat(queryMatch[2]);
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
      
      const addrLower = (parsedAddress + ' ' + parsedName + ' ' + resolvedUrl).toLowerCase();
      const countriesList = [
        { name: 'Sri Lanka', keywords: ['sri lanka', 'colombo', 'kandy', 'galle', 'mahabage', 'wattala', '00200', '00300'] },
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

      if (addrLower.includes('mahabage') || addrLower.includes('wattala')) {
        parsedCity = 'Wattala';
        parsedCountry = 'Sri Lanka';
      }

      return {
        name: parsedName,
        address: parsedAddress,
        city: parsedCity,
        country: parsedCountry,
        latitude: latitude !== null ? latitude : undefined,
        longitude: longitude !== null ? longitude : undefined,
      };
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not configured. Using fallback metadata extractor.');
      return NextResponse.json({ 
        success: true, 
        data: getFallbackData(),
        warning: 'Gemini AI key not set. Extracted location details using URL metadata parser.'
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
- name: Shop/Boutique Name (use the 'Extracted Place Name from URL' above if it represents the shop name, e.g. 'One Galle Face Mall' or 'Thilakma Mahabage')
- address: Street Address (e.g. '1A Centre Road, Colombo 00200')
- city: City (e.g. 'Colombo' or 'Wattala')
- country: Country (e.g. 'Sri Lanka')
- latitude: Latitude (use the extracted Lat ${latitude} above if available, or infer precise latitude number)
- longitude: Longitude (use the extracted Lng ${longitude} above if available, or infer precise longitude number)

Return ONLY a JSON object in this format, with no markdown code blocks, backticks or extra text:
{
  "name": "Shop Name",
  "address": "Street Address",
  "city": "City",
  "country": "Country",
  "latitude": 6.9271601,
  "longitude": 79.8446964
}
Ensure latitude and longitude are returned as numbers.`;

    let geminiRes;
    try {
      geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 350 },
          }),
        }
      );
    } catch (fetchErr) {
      console.error('Fetch to Gemini failed:', fetchErr);
      return NextResponse.json({
        success: true,
        data: getFallbackData(),
        warning: 'AI connection failed. Extracted location details using URL metadata parser.'
      });
    }

    if (!geminiRes.ok) {
      const errJson = await geminiRes.json().catch(() => ({}));
      console.error('Gemini Maps API error:', errJson);
      return NextResponse.json({
        success: true,
        data: getFallbackData(),
        warning: 'AI quota error. Extracted location details using URL metadata parser.'
      });
    }

    const data = await geminiRes.json();
    let responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
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
        latitude: parsed.latitude !== undefined && !isNaN(Number(parsed.latitude)) ? Number(parsed.latitude) : (latitude || undefined),
        longitude: parsed.longitude !== undefined && !isNaN(Number(parsed.longitude)) ? Number(parsed.longitude) : (longitude || undefined)
      };

      return NextResponse.json({ success: true, data: result });
    } catch (parseErr) {
      console.error('Failed to parse Gemini Maps response:', responseText, parseErr);
      return NextResponse.json({
        success: true,
        data: getFallbackData(),
        warning: 'AI returned invalid formatting. Extracted location details using URL metadata parser.'
      });
    }

  } catch (error: any) {
    console.error('Resolve Maps Link error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}
