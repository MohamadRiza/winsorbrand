import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // United Kingdom
  GB: 'GBP', UK: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  // United States & territories
  US: 'USD', PR: 'USD', VI: 'USD', GU: 'USD', MP: 'USD', AS: 'USD',
  // Sri Lanka
  LK: 'LKR',
  // Eurozone
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', IE: 'EUR', FI: 'EUR', PT: 'EUR', GR: 'EUR', CY: 'EUR',
  EE: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', SK: 'EUR',
  SI: 'EUR', HR: 'EUR', MC: 'EUR', SM: 'EUR', VA: 'EUR', AD: 'EUR',
  ME: 'EUR', XK: 'EUR',
  // Middle East
  AE: 'AED', QA: 'QAR', SA: 'AED', KW: 'AED', OM: 'AED', BH: 'AED',
  // Asia-Pacific & Others
  AU: 'AUD', NZ: 'NZD', SG: 'SGD', HK: 'HKD', MY: 'MYR', ID: 'IDR',
  CN: 'CNY', JP: 'JPY', IN: 'INR', MV: 'MVR', CA: 'CAD', CH: 'CHF', LI: 'CHF',
};

const COUNTRY_TO_TZ: Record<string, string> = {
  GB: 'Europe/London',
  LK: 'Asia/Colombo',
  US: 'America/New_York',
  AE: 'Asia/Dubai',
  QA: 'Asia/Qatar',
  IN: 'Asia/Kolkata',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  CA: 'America/Toronto',
  CH: 'Europe/Zurich',
  SG: 'Asia/Singapore',
  HK: 'Asia/Hong_Kong',
  MY: 'Asia/Kuala_Lumpur',
  ID: 'Asia/Jakarta',
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
  MV: 'Indian/Maldives',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
};

export async function GET(req: NextRequest) {
  try {
    // 1. Try Vercel / Cloudflare edge headers (0ms latency in hosted production)
    const vercelCountry = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');
    const vercelCity = req.headers.get('x-vercel-ip-city');
    const vercelTz = req.headers.get('x-vercel-ip-timezone');

    if (vercelCountry && vercelCountry !== 'XX') {
      const countryCode = vercelCountry.toUpperCase();
      const currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
      const timezone = vercelTz || COUNTRY_TO_TZ[countryCode] || 'UTC';
      const city = vercelCity ? decodeURIComponent(vercelCity) : countryCode;

      return NextResponse.json({
        success: true,
        source: 'edge-headers',
        countryCode,
        currency,
        city,
        timezone,
      });
    }

    // 2. Fallback: inspect client IP from x-forwarded-for
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : '';

    const ipParam = clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1' && !clientIp.startsWith('192.168.') && !clientIp.startsWith('10.') ? clientIp : '';

    const ipwhoUrl = ipParam ? `https://ipwho.is/${ipParam}` : 'https://ipwho.is/';
    const res = await fetch(ipwhoUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 3600 }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const countryCode = (data.country_code || '').toUpperCase();
        const currency = COUNTRY_TO_CURRENCY[countryCode] || data.currency?.code || 'USD';
        const timezone = data.timezone?.id || COUNTRY_TO_TZ[countryCode] || 'UTC';
        const city = data.city || data.country || countryCode;

        return NextResponse.json({
          success: true,
          source: 'ipwhois',
          countryCode,
          currency,
          city,
          timezone,
        });
      }
    }

    // 3. Fallback default (LKR / Sri Lanka)
    return NextResponse.json({
      success: true,
      source: 'fallback',
      countryCode: 'LK',
      currency: 'LKR',
      city: 'Colombo',
      timezone: 'Asia/Colombo',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      source: 'error-fallback',
      countryCode: 'LK',
      currency: 'LKR',
      city: 'Colombo',
      timezone: 'Asia/Colombo',
    });
  }
}
