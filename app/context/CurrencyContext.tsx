'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ── Supported currencies ───────────────────────────────────────────────────
export interface CurrencyOption {
  code:   string;
  label:  string;
  symbol: string;
  flag:   string;
  iso:    string;
}

export interface GeoInfo {
  countryCode: string;
  city:        string;
  timezone:    string;
  currency:    string;
  source?:     string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'LKR', label: 'Sri Lankan Rupee',      symbol: 'LKR',  flag: '🇱🇰', iso: 'lk' },
  { code: 'USD', label: 'US Dollar',              symbol: 'USD',   flag: '🇺🇸', iso: 'us' },
  { code: 'GBP', label: 'British Pound',          symbol: 'GBP',   flag: '🇬🇧', iso: 'gb' },
  { code: 'EUR', label: 'Euro',                   symbol: 'EUR',   flag: '🇪🇺', iso: 'eu' },
  { code: 'AUD', label: 'Australian Dollar',      symbol: 'AUD',  flag: '🇦🇺', iso: 'au' },
  { code: 'NZD', label: 'New Zealand Dollar',     symbol: 'NZD', flag: '🇳🇿', iso: 'nz' },
  { code: 'CAD', label: 'Canadian Dollar',        symbol: 'CAD',  flag: '🇨🇦', iso: 'ca' },
  { code: 'CHF', label: 'Swiss Franc',            symbol: 'CHF',  flag: '🇨🇭', iso: 'ch' },
  { code: 'HKD', label: 'Hong Kong Dollar',       symbol: 'HKD', flag: '🇭🇰', iso: 'hk' },
  { code: 'SGD', label: 'Singapore Dollar',       symbol: 'SGD',  flag: '🇸🇬', iso: 'sg' },
  { code: 'MYR', label: 'Malaysian Ringgit',      symbol: 'MYR',  flag: '🇲🇾', iso: 'my' },
  { code: 'IDR', label: 'Indonesian Rupiah',      symbol: 'IDR',  flag: '🇮🇩', iso: 'id' },
  { code: 'CNY', label: 'Chinese Yuan',           symbol: 'CNY',   flag: '🇨🇳', iso: 'cn' },
  { code: 'JPY', label: 'Japanese Yen',           symbol: 'JPY',   flag: '🇯🇵', iso: 'jp' },
  { code: 'INR', label: 'Indian Rupee',           symbol: 'INR',   flag: '🇮🇳', iso: 'in' },
  { code: 'AED', label: 'UAE Dirham',             symbol: 'AED', flag: '🇦🇪', iso: 'ae' },
  { code: 'QAR', label: 'Qatari Riyal',           symbol: 'QAR',  flag: '🇶🇦', iso: 'qa' },
  { code: 'MVR', label: 'Maldivian Rufiyaa',      symbol: 'MVR',  flag: '🇲🇻', iso: 'mv' },
];

// ── Context shape ──────────────────────────────────────────────────────────
interface CurrencyContextValue {
  selected:       CurrencyOption;
  detectedCode:   string;         // currency code detected e.g. 'GBP' or 'LKR'
  geoInfo:        GeoInfo | null; // visitor's physical geolocation & timezone
  rates:          Record<string, number>; // LKR → X rates
  loading:        boolean;
  lastUpdated:    Date | null;
  setCurrency:    (code: string) => void;
  convertPrice:   (lkrAmount: number) => string; // formatted string
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selected,     setSelected]     = useState<CurrencyOption>(CURRENCIES[0]); // default LKR
  const [detectedCode, setDetectedCode] = useState('LKR');
  const [geoInfo,      setGeoInfo]      = useState<GeoInfo | null>(null);
  const [rates,        setRates]        = useState<Record<string, number>>({});
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

  // 1. Detect user location & currency (Automatic geo-adaptation)
  useEffect(() => {
    // Immediate pre-hydration check from localStorage for fastest render
    try {
      const savedCurrency = localStorage.getItem('winsor_currency');
      if (savedCurrency) {
        const found = CURRENCIES.find(c => c.code === savedCurrency);
        if (found) setSelected(found);
      }
    } catch {
      // localStorage may be disabled
    }

    const detectLocation = async () => {
      try {
        // Internal secure HTTPS API endpoint with Vercel edge header inspection & IP detection
        const res = await fetch('/api/geo');
        if (res.ok) {
          const data: GeoInfo = await res.json();
          if (data && data.currency) {
            setGeoInfo(data);
            setDetectedCode(data.currency);

            const savedCountry = localStorage.getItem('winsor_user_country');
            const hasCountryChanged = !savedCountry || savedCountry.toUpperCase() !== data.countryCode.toUpperCase();

            if (hasCountryChanged) {
              // Visitor has arrived in a new country (e.g. traveling Sri Lanka -> UK)!
              // Automatically switch to the new country's currency:
              const matched = CURRENCIES.find(c => c.code === data.currency);
              if (matched) {
                setSelected(matched);
                localStorage.setItem('winsor_currency', matched.code);
              }
              localStorage.setItem('winsor_user_country', data.countryCode.toUpperCase());
            } else {
              // Visitor is in the same country. If no saved manual preference exists, use detected currency.
              const saved = localStorage.getItem('winsor_currency');
              if (!saved) {
                const matched = CURRENCIES.find(c => c.code === data.currency);
                if (matched) {
                  setSelected(matched);
                  localStorage.setItem('winsor_currency', matched.code);
                }
              }
            }
            return;
          }
        }
      } catch {
        // Fallback below
      }

      // Offline / API fallback using browser timezone hint
      try {
        const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        let fallbackCurrency = 'LKR';
        let fallbackCountry = 'LK';

        if (browserTz.includes('London') || browserTz.includes('Belfast')) {
          fallbackCurrency = 'GBP';
          fallbackCountry = 'GB';
        } else if (browserTz.includes('New_York') || browserTz.includes('Los_Angeles') || browserTz.includes('Chicago') || browserTz.includes('Denver')) {
          fallbackCurrency = 'USD';
          fallbackCountry = 'US';
        } else if (browserTz.includes('Dubai')) {
          fallbackCurrency = 'AED';
          fallbackCountry = 'AE';
        } else if (browserTz.includes('Paris') || browserTz.includes('Berlin') || browserTz.includes('Rome') || browserTz.includes('Madrid')) {
          fallbackCurrency = 'EUR';
          fallbackCountry = 'DE';
        } else if (browserTz.includes('Sydney') || browserTz.includes('Melbourne')) {
          fallbackCurrency = 'AUD';
          fallbackCountry = 'AU';
        }

        const savedCountry = localStorage.getItem('winsor_user_country');
        if (!savedCountry || savedCountry !== fallbackCountry) {
          const matched = CURRENCIES.find(c => c.code === fallbackCurrency);
          if (matched) {
            setSelected(matched);
            localStorage.setItem('winsor_currency', matched.code);
          }
          localStorage.setItem('winsor_user_country', fallbackCountry);
        }
      } catch {
        // Ignore
      }
    };

    detectLocation();
  }, []);

  // 2. Fetch exchange rates (LKR as base)
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/lkr.json'
        );
        const data = await res.json();

        // data.lkr = { usd: 0.003, eur: 0.0028, ... }
        const lkrRates: Record<string, number> = {};
        const raw = data.lkr as Record<string, number>;

        CURRENCIES.forEach(c => {
          const key = c.code.toLowerCase();
          if (raw[key]) lkrRates[c.code] = raw[key];
        });
        lkrRates['LKR'] = 1; // base

        setRates(lkrRates);
        setLastUpdated(new Date());
      } catch {
        // Fallback approximate rates if API fails
        setRates({ LKR: 1, USD: 0.0033, GBP: 0.0026, EUR: 0.003, AED: 0.012 });
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
    // Refresh every 6 hours
    const interval = setInterval(fetchRates, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setCurrency = useCallback((code: string) => {
    const found = CURRENCIES.find(c => c.code === code);
    if (found) {
      setSelected(found);
      try {
        localStorage.setItem('winsor_currency', code);
        // Bind choice to current country so country transitions still trigger auto-update
        if (geoInfo?.countryCode) {
          localStorage.setItem('winsor_user_country', geoInfo.countryCode);
        }
      } catch {
        // Ignore
      }
    }
  }, [geoInfo]);

  const convertPrice = useCallback((lkrAmount: number): string => {
    const rate = rates[selected.code] ?? 1;
    const converted = lkrAmount * rate;

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: selected.code === 'JPY' || selected.code === 'IDR' ? 0 : 2,
      maximumFractionDigits: selected.code === 'JPY' || selected.code === 'IDR' ? 0 : 2,
    }).format(converted);

    return `${selected.symbol} ${formatted}`;
  }, [rates, selected]);

  return (
    <CurrencyContext.Provider value={{
      selected, detectedCode, geoInfo, rates, loading, lastUpdated, setCurrency, convertPrice,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
