'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ── Supported currencies ───────────────────────────────────────────────────
export interface CurrencyOption {
  code:   string;
  label:  string;
  symbol: string;
  flag:   string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'LKR', label: 'Sri Lankan Rupee',      symbol: 'LKR',  flag: '🇱🇰' },
  { code: 'USD', label: 'US Dollar',              symbol: 'USD',   flag: '🇺🇸' },
  { code: 'GBP', label: 'British Pound',          symbol: 'GBP',   flag: '🇬🇧' },
  { code: 'EUR', label: 'Euro',                   symbol: 'EUR',   flag: '🇪🇺' },
  { code: 'AUD', label: 'Australian Dollar',      symbol: 'AUD',  flag: '🇦🇺' },
  { code: 'NZD', label: 'New Zealand Dollar',     symbol: 'NZD', flag: '🇳🇿' },
  { code: 'CAD', label: 'Canadian Dollar',        symbol: 'CAD',  flag: '🇨🇦' },
  { code: 'CHF', label: 'Swiss Franc',            symbol: 'CHF',  flag: '🇨🇭' },
  { code: 'HKD', label: 'Hong Kong Dollar',       symbol: 'HKD', flag: '🇭🇰' },
  { code: 'SGD', label: 'Singapore Dollar',       symbol: 'SGD',  flag: '🇸🇬' },
  { code: 'MYR', label: 'Malaysian Ringgit',      symbol: 'MYR',  flag: '🇲🇾' },
  { code: 'IDR', label: 'Indonesian Rupiah',      symbol: 'IDR',  flag: '🇮🇩' },
  { code: 'CNY', label: 'Chinese Yuan',           symbol: 'CNY',   flag: '🇨🇳' },
  { code: 'JPY', label: 'Japanese Yen',           symbol: 'JPY',   flag: '🇯🇵' },
  { code: 'INR', label: 'Indian Rupee',           symbol: 'INR',   flag: '🇮🇳' },
  { code: 'AED', label: 'UAE Dirham',             symbol: 'AED', flag: '🇦🇪' },
  { code: 'QAR', label: 'Qatari Riyal',           symbol: 'QAR',  flag: '🇶🇦' },
  { code: 'MVR', label: 'Maldivian Rufiyaa',      symbol: 'MVR',  flag: '🇲🇻' },
];

// Map country currency codes returned by ip-api to our supported list
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  LKR: 'LKR', USD: 'USD', GBP: 'GBP', EUR: 'EUR',
  AUD: 'AUD', NZD: 'NZD', CAD: 'CAD', CHF: 'CHF',
  HKD: 'HKD', SGD: 'SGD', MYR: 'MYR', IDR: 'IDR',
  CNY: 'CNY', JPY: 'JPY', INR: 'INR', AED: 'AED',
  QAR: 'QAR', MVR: 'MVR',
};

// ── Context shape ──────────────────────────────────────────────────────────
interface CurrencyContextValue {
  selected:       CurrencyOption;
  detectedCode:   string;         // what ip-api detected
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
  const [rates,        setRates]        = useState<Record<string, number>>({});
  const [loading,      setLoading]      = useState(true);
  const [lastUpdated,  setLastUpdated]  = useState<Date | null>(null);

  // 1. Detect user location & currency
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const res  = await fetch('http://ip-api.com/json/?fields=currency');
        const data = await res.json();
        const code = data?.currency as string;

        if (code && COUNTRY_CURRENCY_MAP[code]) {
          const matched = CURRENCIES.find(c => c.code === COUNTRY_CURRENCY_MAP[code]);
          if (matched) {
            setDetectedCode(matched.code);

            // Only auto-set if no manual preference saved
            const saved = localStorage.getItem('winsor_currency');
            if (!saved) setSelected(matched);
          }
        }
      } catch {
        // Silently fall back to LKR
      }
    };

    // Restore manual preference from localStorage
    const saved = localStorage.getItem('winsor_currency');
    if (saved) {
      const found = CURRENCIES.find(c => c.code === saved);
      if (found) setSelected(found);
    }

    detectLocation();
  }, []);

  // 2. Fetch exchange rates (LKR as base)
  //    Using fawazahmed0/currency-api via jsDelivr — no key, no rate limit
  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const res  = await fetch(
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
        setRates({ LKR: 1, USD: 0.0033, GBP: 0.0026, EUR: 0.003 });
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
      localStorage.setItem('winsor_currency', code);
    }
  }, []);

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
      selected, detectedCode, rates, loading, lastUpdated, setCurrency, convertPrice,
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