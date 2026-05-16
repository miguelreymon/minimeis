// Configuración de monedas soportadas. La moneda BASE es EUR
// (todos los precios del catálogo están almacenados en EUR).
//
// Cambios fácil:
//  - Añadir un país: incluir su código ISO-2 en COUNTRY_TO_CURRENCY.
//  - Añadir una moneda: añadirla a SUPPORTED_CURRENCIES.

export type CurrencyCode = 'EUR' | 'MXN' | 'COP' | 'ARS' | 'BOB';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  decimals: number;
  // Posición del símbolo: 'suffix' (5€) o 'prefix' ($5)
  symbolPosition: 'prefix' | 'suffix';
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: { code: 'EUR', symbol: '€', locale: 'es-ES', decimals: 0, symbolPosition: 'suffix' },
  MXN: { code: 'MXN', symbol: '$', locale: 'es-MX', decimals: 0, symbolPosition: 'prefix' },
  COP: { code: 'COP', symbol: '$', locale: 'es-CO', decimals: 0, symbolPosition: 'prefix' },
  ARS: { code: 'ARS', symbol: '$', locale: 'es-AR', decimals: 0, symbolPosition: 'prefix' },
  BOB: { code: 'BOB', symbol: 'Bs', locale: 'es-BO', decimals: 0, symbolPosition: 'prefix' },
};

// Mapa país (ISO-2) → moneda. Cualquier país que NO esté aquí
// se mostrará en EUR (España es la principal por defecto).
export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  ES: 'EUR',
  MX: 'MXN',
  CO: 'COP',
  AR: 'ARS',
  BO: 'BOB',
};

// Tipos de cambio de respaldo (1 EUR = X) por si falla la API.
// Valores aproximados Enero 2026. Se actualizan en vivo desde open.er-api.com.
export const FALLBACK_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  MXN: 22,
  COP: 4400,
  ARS: 1100,
  BOB: 7.5,
};

export function getCurrencyForCountry(countryCode?: string | null): CurrencyCode {
  if (!countryCode) return 'EUR';
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || 'EUR';
}

// Convierte un importe EUR → moneda destino usando un mapa de rates.
export function convertFromEUR(amountEUR: number, currency: CurrencyCode, rates: Record<string, number>): number {
  const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
  return amountEUR * rate;
}

// Redondea a un valor "psicológico" agradable según la magnitud y moneda.
// Ej: 49.99 EUR → 1099 MXN (no 1098.78); 49 EUR → 215.600 COP → 215.900 COP.
function smartRound(amount: number, currency: CurrencyCode): number {
  if (currency === 'EUR') return Math.round(amount);
  if (amount >= 10000) return Math.round(amount / 100) * 100;
  if (amount >= 1000) return Math.round(amount / 10) * 10;
  if (amount >= 100) return Math.round(amount);
  return Math.round(amount);
}

export function formatPrice(amountEUR: number, currency: CurrencyCode, rates: Record<string, number>): string {
  const cfg = SUPPORTED_CURRENCIES[currency];
  const converted = convertFromEUR(amountEUR, currency, rates);
  const rounded = smartRound(converted, currency);

  // Usamos Intl para separadores de miles correctos en cada locale.
  const formatted = new Intl.NumberFormat(cfg.locale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  }).format(rounded);

  return cfg.symbolPosition === 'prefix'
    ? `${cfg.symbol}${formatted}`
    : `${formatted}${cfg.symbol}`;
}
