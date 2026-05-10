# Minimeis (Game Over)

E-commerce Next.js para la consola Gameover®. Tienda online optimizada para Vercel.

## Stack
- **Framework:** Next.js 15 (App Router) + React 19 + TypeScript
- **Estilo:** Tailwind CSS v3 + shadcn/ui (Radix)
- **Pagos:** Stripe (PaymentIntent embebido + Bizum/Apple Pay/Google Pay)
- **Emails:** Resend
- **Analítica:** Vercel Analytics + Speed Insights, Facebook Pixel

## Desarrollo local

```bash
yarn install
yarn dev          # http://localhost:3000
yarn build        # build de producción
yarn start        # servir build de producción
yarn typecheck    # comprobación de tipos sin emitir
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena las claves:

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `STRIPE_SECRET_KEY` | Clave secreta de Stripe | https://dashboard.stripe.com/apikeys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública de Stripe | https://dashboard.stripe.com/apikeys |
| `RESEND_API_KEY` | Clave de Resend para emails de pedido | https://resend.com/api-keys |
| `ADMIN_EMAIL` | Email para notificaciones de pedido | — |
| `GEMINI_API_KEY` | Opcional. AI Studio | https://aistudio.google.com/ |

Sin las claves de Stripe el checkout muestra el error "Pagos no configurados". Sin la clave de Resend los emails se simulan en consola.

## Despliegue en Vercel

1. Sube este repo a GitHub: `git push origin main`.
2. En https://vercel.com/new conecta el repositorio.
3. Vercel detecta Next.js automáticamente (no toques `Build Command` ni `Output Directory`).
4. En **Settings → Environment Variables** añade `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `RESEND_API_KEY` y `ADMIN_EMAIL` para los entornos *Production*, *Preview* y *Development*.
5. Click en **Deploy**.

El archivo `vercel.json` fija la región a `fra1` (Frankfurt). Cámbialo si quieres otra región más cercana a tu audiencia.

## Estructura

```
src/
  app/                 # App Router de Next.js (rutas)
    actions.ts         # Server actions (Stripe + Resend)
    admin/             # Panel de administración
    checkout/          # Flujo de pago
    producto/[slug]/   # Página de producto dinámica
  components/
    ui/                # shadcn/ui primitives
  context/             # CartContext, ConfigContext
  hooks/               # use-toast, use-mobile
  lib/                 # utils, content, products, images
public/
  images/              # Imágenes y vídeos del sitio
```

## Notas

- ISR activado en layout (`export const revalidate = 60`): páginas se regeneran cada 60s.
- Server Actions habilitadas con `bodySizeLimit: 100mb` para subida de imágenes desde el panel admin.
- Imágenes optimizadas con `next/image` y formatos AVIF/WebP automáticos.
