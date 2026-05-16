'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  FALLBACK_RATES,
  getCurrencyForCountry,
  formatPrice as formatPriceLib,
  convertFromEUR,
} from '@/lib/currency';

interface CurrencyContextValue {
  currency: CurrencyCode;
  countryCode: string | null;
  rates: Record<string, number>;
  ready: boolean;
  setCurrency: (c: CurrencyCode) => void;
  format: (amountEUR: number) => string;
  convert: (amountEUR: number) => number;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'minimeis_currency_v1';
const RATES_STORAGE_KEY = 'minimeis_rates_v1';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

interface CachedCurrency {
  currency: CurrencyCode;
  countryCode: string | null;
  detectedAt: number;
  manual?: boolean;
}

async function detectCountry(): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('https://api.country.is/', { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.country || null;
  } catch {
    return null;
  }
}

async function fetchRates(): Promise<Record<string, number> | null> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.rates || null;
  } catch {
    return null;
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('EUR');
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // 1) URL override: ?cur=MXN (útil para previsualizar)
      let urlOverride: CurrencyCode | null = null;
      try {
        const urlCur = new URLSearchParams(window.location.search).get('cur');
        if (urlCur && SUPPORTED_CURRENCIES[urlCur.toUpperCase() as CurrencyCode]) {
          urlOverride = urlCur.toUpperCase() as CurrencyCode;
        }
      } catch {}

      // 2) Cargar moneda cacheada (incluye preferencia manual del usuario)
      let cachedCurrency: CachedCurrency | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) cachedCurrency = JSON.parse(raw);
      } catch {}

      // 2) Cargar rates cacheados (TTL 12h)
      let cachedRates: CachedRates | null = null;
      try {
        const raw = localStorage.getItem(RATES_STORAGE_KEY);
        if (raw) cachedRates = JSON.parse(raw);
      } catch {}

      // Aplicar INMEDIATAMENTE moneda y rates conocidos (override URL > cache > default)
      // para no mostrar el flash de EUR mientras se completan las llamadas a APIs.
      const immediateRates = cachedRates?.rates || FALLBACK_RATES;
      setRates(immediateRates);
      if (urlOverride) {
        setCurrencyState(urlOverride);
        setCountryCode(cachedCurrency?.countryCode ?? null);
      } else if (cachedCurrency) {
        setCurrencyState(cachedCurrency.currency);
        setCountryCode(cachedCurrency.countryCode);
      }
      setReady(true);

      const ratesStale =
        !cachedRates || Date.now() - cachedRates.fetchedAt > CACHE_TTL_MS;

      // Fetch en paralelo lo que falte
      const tasks: Promise<any>[] = [];
      const needCountry =
        !cachedCurrency?.manual &&
        (!cachedCurrency || Date.now() - cachedCurrency.detectedAt > CACHE_TTL_MS);
      tasks.push(needCountry ? detectCountry() : Promise.resolve(cachedCurrency?.countryCode ?? null));
      tasks.push(ratesStale ? fetchRates() : Promise.resolve(cachedRates?.rates ?? null));

      const [detectedCountry, freshRates] = await Promise.all(tasks);
      if (cancelled) return;

      // Aplicar rates
      const finalRates: Record<string, number> = freshRates || cachedRates?.rates || FALLBACK_RATES;
      setRates(finalRates);
      if (freshRates) {
        try {
          localStorage.setItem(
            RATES_STORAGE_KEY,
            JSON.stringify({ rates: freshRates, fetchedAt: Date.now() } as CachedRates),
          );
        } catch {}
      }

      // Aplicar moneda
      let finalCurrency: CurrencyCode;
      let finalCountry: string | null;

      if (urlOverride) {
        finalCurrency = urlOverride;
        finalCountry = cachedCurrency?.countryCode ?? null;
      } else if (cachedCurrency?.manual) {
        finalCurrency = cachedCurrency.currency;
        finalCountry = cachedCurrency.countryCode;
      } else if (detectedCountry) {
        finalCountry = detectedCountry;
        finalCurrency = getCurrencyForCountry(detectedCountry);
      } else if (cachedCurrency) {
        finalCurrency = cachedCurrency.currency;
        finalCountry = cachedCurrency.countryCode;
      } else {
        finalCurrency = 'EUR';
        finalCountry = null;
      }

      setCurrencyState(finalCurrency);
      setCountryCode(finalCountry);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            currency: finalCurrency,
            countryCode: finalCountry,
            detectedAt: Date.now(),
            manual: cachedCurrency?.manual ?? false,
          } as CachedCurrency),
        );
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    if (!SUPPORTED_CURRENCIES[c]) return;
    setCurrencyState(c);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const prev: CachedCurrency | null = raw ? JSON.parse(raw) : null;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currency: c,
          countryCode: prev?.countryCode ?? null,
          detectedAt: Date.now(),
          manual: true,
        } as CachedCurrency),
      );
    } catch {}
  }, []);

  const format = useCallback(
    (amountEUR: number) => formatPriceLib(amountEUR, currency, rates),
    [currency, rates],
  );

  const convert = useCallback(
    (amountEUR: number) => convertFromEUR(amountEUR, currency, rates),
    [currency, rates],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({ currency, countryCode, rates, ready, setCurrency, format, convert }),
    [currency, countryCode, rates, ready, setCurrency, format, convert],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Fallback seguro fuera del provider (no debería ocurrir).
    return {
      currency: 'EUR',
      countryCode: null,
      rates: FALLBACK_RATES,
      ready: true,
      setCurrency: () => {},
      format: (amount: number) => formatPriceLib(amount, 'EUR', FALLBACK_RATES),
      convert: (amount: number) => amount,
    };
  }
  return ctx;
}
