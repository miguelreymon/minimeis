'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';

const FLAGS: Record<CurrencyCode, string> = {
  EUR: '🇪🇸',
  MXN: '🇲🇽',
  COP: '🇨🇴',
  ARS: '🇦🇷',
  BOB: '🇧🇴',
};

const LABELS: Record<CurrencyCode, string> = {
  EUR: 'España (EUR)',
  MXN: 'México (MXN)',
  COP: 'Colombia (COP)',
  ARS: 'Argentina (ARS)',
  BOB: 'Bolivia (BOB)',
};

export function CurrencySwitcher({ variant = 'header' }: { variant?: 'header' | 'mobile' }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Cambiar moneda"
          data-testid="currency-switcher"
          className={
            variant === 'header'
              ? 'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium text-primary-foreground hover:bg-primary/90 transition'
              : 'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-secondary transition w-full'
          }
        >
          <Globe className="h-4 w-4" aria-hidden />
          <span className="text-base leading-none">{FLAGS[currency]}</span>
          <span className="font-semibold tracking-wide">{currency}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {(Object.keys(SUPPORTED_CURRENCIES) as CurrencyCode[]).map((code) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => setCurrency(code)}
            className="flex items-center gap-2 cursor-pointer"
            data-testid={`currency-option-${code}`}
          >
            <span className="text-base leading-none">{FLAGS[code]}</span>
            <span className="flex-1">{LABELS[code]}</span>
            {currency === code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
