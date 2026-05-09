'use client';

import { useState } from 'react';
import { saveContentAction } from './actions';
import ImagePicker from './ImagePicker';

/* ---------- Helpers ---------- */

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

type AnyObj = Record<string, any>;

/* ---------- UI primitives ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function Text({
  value,
  onChange,
  testid,
}: {
  value: string;
  onChange: (v: string) => void;
  testid?: string;
}) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded px-3 py-2 text-sm"
      data-testid={testid}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  testid,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  testid?: string;
}) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full border rounded px-3 py-2 text-sm font-mono"
      data-testid={testid}
    />
  );
}

function Num({
  value,
  onChange,
  testid,
}: {
  value: number;
  onChange: (v: number) => void;
  testid?: string;
}) {
  return (
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      className="w-full border rounded px-3 py-2 text-sm"
      data-testid={testid}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="font-bold text-lg">{title}</h3>
      {children}
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-red-600 hover:text-red-800 text-sm font-medium"
    >
      Eliminar
    </button>
  );
}

function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-slate-200 hover:bg-slate-300 px-3 py-2 rounded text-sm font-medium"
    >
      {children}
    </button>
  );
}

/* ---------- Main Dashboard ---------- */

const TABS = [
  'header',
  'menu',
  'footer',
  'productos',
  'home',
  'reviews',
  'faq',
  'cupones',
  'imagenes',
  'tema',
] as const;
type Tab = (typeof TABS)[number];

export default function AdminDashboard({ initialContent }: { initialContent: any }) {
  const [content, setContent] = useState<AnyObj>(initialContent);
  const [tab, setTab] = useState<Tab>('header');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const sc = content.siteContent;

  const update = (mutator: (draft: AnyObj) => void) => {
    setContent((prev) => {
      const next = clone(prev);
      mutator(next);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await saveContentAction(content);
    setSaving(false);
    if (res.success) {
      setMsg({ type: 'ok', text: 'Guardado. Haz rebuild para ver los cambios en el sitio.' });
    } else {
      setMsg({ type: 'err', text: res.error || 'Error' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-1 bg-white rounded-lg border p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded capitalize transition-colors ${
                tab === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
              data-testid={`admin-tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {msg && (
            <span
              className={`text-sm ${msg.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}
              data-testid="admin-save-msg"
            >
              {msg.text}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold disabled:opacity-50"
            data-testid="admin-save-btn"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {tab === 'header' && <HeaderTab sc={sc} update={update} />}
        {tab === 'menu' && <MenuTab sc={sc} update={update} />}
        {tab === 'footer' && <FooterTab sc={sc} update={update} />}
        {tab === 'productos' && <ProductsTab sc={sc} update={update} />}
        {tab === 'home' && <HomeTab sc={sc} update={update} />}
        {tab === 'reviews' && <ReviewsTab sc={sc} update={update} />}
        {tab === 'faq' && <FaqTab sc={sc} update={update} />}
        {tab === 'cupones' && <CouponsTab sc={sc} update={update} />}
        {tab === 'imagenes' && <ImagesTab />}
        {tab === 'tema' && <ThemeTab sc={sc} update={update} />}
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */

function HeaderTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  return (
    <Section title="Barra superior y logo">
      <Field label="Banner superior (mensaje que gira)">
        <Text
          value={sc.header.announcementBar}
          onChange={(v) => update((d) => (d.siteContent.header.announcementBar = v))}
          testid="header-announcement"
        />
      </Field>
      <Field label="Logo (imagen)">
        <ImagePicker
          value={sc.header.logo}
          onChange={(v) => update((d) => (d.siteContent.header.logo = v))}
        />
      </Field>
    </Section>
  );
}

function FooterTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const f = sc.footer;
  return (
    <>
      <Section title="Marca y contacto">
        <Field label="Nombre de la marca">
          <Text
            value={f.brandName}
            onChange={(v) => update((d) => (d.siteContent.footer.brandName = v))}
          />
        </Field>
        <Field label="Eslogan">
          <Text
            value={f.brandSlogan}
            onChange={(v) => update((d) => (d.siteContent.footer.brandSlogan = v))}
          />
        </Field>
        <Field label="Número de WhatsApp (solo dígitos)">
          <Text
            value={f.whatsAppNumber}
            onChange={(v) => update((d) => (d.siteContent.footer.whatsAppNumber = v))}
          />
        </Field>
        <Field label="Título suscripción">
          <Text
            value={f.subscriptionTitle}
            onChange={(v) => update((d) => (d.siteContent.footer.subscriptionTitle = v))}
          />
        </Field>
        <Field label="Eslogan suscripción">
          <Text
            value={f.subscriptionSlogan}
            onChange={(v) => update((d) => (d.siteContent.footer.subscriptionSlogan = v))}
          />
        </Field>
      </Section>

      <Section title="Enlaces de políticas">
        {(f.policyLinks || []).map((link: AnyObj, i: number) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
            <Field label={`Texto ${i + 1}`}>
              <Text
                value={link.text}
                onChange={(v) =>
                  update((d) => (d.siteContent.footer.policyLinks[i].text = v))
                }
              />
            </Field>
            <Field label="URL">
              <Text
                value={link.href}
                onChange={(v) =>
                  update((d) => (d.siteContent.footer.policyLinks[i].href = v))
                }
              />
            </Field>
            <RemoveBtn
              onClick={() =>
                update((d) => d.siteContent.footer.policyLinks.splice(i, 1))
              }
            />
          </div>
        ))}
        <AddBtn
          onClick={() =>
            update((d) =>
              d.siteContent.footer.policyLinks.push({ text: 'Nuevo', href: '/' })
            )
          }
        >
          + Añadir enlace
        </AddBtn>
      </Section>

      <Section title="Redes sociales">
        {(f.socialLinks || []).map((link: AnyObj, i: number) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
            <Field label="Nombre">
              <Text
                value={link.name}
                onChange={(v) =>
                  update((d) => (d.siteContent.footer.socialLinks[i].name = v))
                }
              />
            </Field>
            <Field label="URL">
              <Text
                value={link.href}
                onChange={(v) =>
                  update((d) => (d.siteContent.footer.socialLinks[i].href = v))
                }
              />
            </Field>
            <Field label="Icono (lucide)">
              <Text
                value={link.icon}
                onChange={(v) =>
                  update((d) => (d.siteContent.footer.socialLinks[i].icon = v))
                }
              />
            </Field>
            <RemoveBtn
              onClick={() =>
                update((d) => d.siteContent.footer.socialLinks.splice(i, 1))
              }
            />
          </div>
        ))}
        <AddBtn
          onClick={() =>
            update((d) =>
              d.siteContent.footer.socialLinks.push({
                name: 'Nuevo',
                href: '#',
                icon: 'Facebook',
              })
            )
          }
        >
          + Añadir red social
        </AddBtn>
      </Section>
    </>
  );
}

function ProductsTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const products: AnyObj[] = sc.products || [];
  const [editing, setEditing] = useState<number | null>(null);

  const setProducts = (mut: (arr: AnyObj[]) => void) =>
    update((d) => {
      if (!d.siteContent.products) d.siteContent.products = [];
      mut(d.siteContent.products);
    });

  const addProduct = () => {
    const base: AnyObj = {
      id: `prod-${Date.now()}`,
      slug: `nuevo-producto-${Date.now()}`,
      name: 'Nuevo producto',
      shortDescription: 'Descripción breve del producto',
      cartImage: '/images/aa.png',
      variants: [
        { id: 'v1', name: 'Única', price: 0, originalPrice: 0, isBestSeller: true },
      ],
      images: [
        { id: 'img1', src: '/images/aa.png', alt: '', hint: '' },
      ],
      whatsInTheBox: [],
      productInfoAccordion: {
        shipping: {
          title: 'Envío y seguimiento',
          freeShippingTitle: '📦 Envío Gratis',
          freeShippingContent: '',
          trackingTitle: '🚚 Seguimiento',
          trackingContent: '',
          contactInfo: '',
        },
        warranty: {
          title: 'Garantía y Devoluciones',
          satisfactionGuarantee: '',
          returnsPolicy: '',
        },
        extra: { title: 'Extra', content: '' },
      },
      distributorBadge: '',
      purchaseBenefits: { gifts: '', games: '', tv: '' },
      countdownOffer: { activeText: '', expiredText: '' },
      selectionOptions: { colors: { label: 'COLOR', options: [] } },
    };
    setProducts((arr) => arr.push(base));
    setEditing(products.length);
  };

  const duplicateProduct = (i: number) => {
    const copy: AnyObj = clone(products[i]);
    copy.id = `prod-${Date.now()}`;
    copy.slug = `${copy.slug || 'producto'}-copia-${Date.now()}`;
    copy.name = `${copy.name} (copia)`;
    setProducts((arr) => arr.push(copy));
  };

  if (editing !== null && products[editing]) {
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setEditing(null)}
            className="text-sm text-slate-600 hover:text-slate-900"
            data-testid="back-to-products-list"
          >
            ← Volver al listado
          </button>
          <span className="text-sm text-slate-500">
            Editando: <strong>{products[editing].name}</strong>
          </span>
        </div>
        <ProductEditor
          product={products[editing]}
          allProducts={products}
          editingIndex={editing}
          onChange={(mut) => setProducts((arr) => mut(arr[editing]))}
          sc={sc}
        />
      </>
    );
  }

  return (
    <Section title={`Productos (${products.length})`}>
      <p className="text-sm text-slate-600">
        Aquí gestionas todos los productos del catálogo. Cada uno tiene su propia página en{' '}
        <code>/producto/[slug]</code>. La home muestra todos en cuadrícula automáticamente.
      </p>
      <Field label="Producto destacado (por slug)">
        <select
          value={sc.featuredProductSlug || ''}
          onChange={(e) => update((d) => (d.siteContent.featuredProductSlug = e.target.value))}
          className="w-full border rounded px-3 py-2 text-sm"
          data-testid="featured-product-select"
        >
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} ({p.slug})
            </option>
          ))}
        </select>
      </Field>
      <div className="space-y-2 mt-4">
        {products.map((p, i) => (
          <div
            key={p.slug || i}
            className="flex items-center gap-3 bg-slate-50 border rounded p-3"
            data-testid={`product-row-${p.slug}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.cartImage || '/images/aa.png'}
              alt=""
              className="w-14 h-14 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{p.name}</p>
              <p className="text-xs text-slate-500">
                /producto/{p.slug} · {(p.variants || []).length} variantes
              </p>
            </div>
            <button
              onClick={() => setEditing(i)}
              className="bg-slate-900 text-white px-3 py-1.5 rounded text-sm font-medium"
              data-testid={`edit-product-${p.slug}`}
            >
              Editar
            </button>
            <button
              onClick={() => duplicateProduct(i)}
              className="bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded text-sm"
              data-testid={`duplicate-product-${p.slug}`}
            >
              Duplicar
            </button>
            <button
              onClick={() => {
                if (confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) {
                  setProducts((arr) => arr.splice(i, 1));
                }
              }}
              className="text-red-600 hover:text-red-800 text-sm font-medium px-2"
              data-testid={`delete-product-${p.slug}`}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
      <AddBtn onClick={addProduct}>+ Añadir producto nuevo</AddBtn>
    </Section>
  );
}

function ProductEditor({
  product,
  allProducts,
  editingIndex,
  onChange,
  sc,
}: {
  product: AnyObj;
  allProducts: AnyObj[];
  editingIndex: number;
  onChange: (mut: (p: AnyObj) => void) => void;
  sc: AnyObj;
}) {
  const p = product;
  const setP = onChange;

  return (
    <>
      <Section title="Datos básicos">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ID interno">
            <Text value={p.id} onChange={(v) => setP((p) => (p.id = v))} />
          </Field>
          <Field label="Slug (URL)">
            <Text
              value={p.slug || ''}
              onChange={(v) =>
                setP((p) => (p.slug = v.toLowerCase().replace(/[^a-z0-9-]/g, '-')))
              }
            />
          </Field>
        </div>
        <Field label="Nombre">
          <Text value={p.name} onChange={(v) => setP((p) => (p.name = v))} />
        </Field>
        <Field label="Descripción corta (se muestra en la cuadrícula de la home)">
          <TextArea
            value={p.shortDescription || ''}
            rows={2}
            onChange={(v) => setP((p) => (p.shortDescription = v))}
          />
        </Field>
        <Field label="Badge distribuidor">
          <Text
            value={p.distributorBadge || ''}
            onChange={(v) => setP((p) => (p.distributorBadge = v))}
          />
        </Field>
        <Field label="Imagen principal (miniatura y carrito)">
          <ImagePicker value={p.cartImage} onChange={(v) => setP((p) => (p.cartImage = v))} />
        </Field>
        <Field label="Imagen de pasarelas de pago (banner Bizum / Stripe debajo del botón Comprar)">
          <ImagePicker
            value={p.paymentGatewaysImage || ''}
            onChange={(v) => setP((p) => (p.paymentGatewaysImage = v))}
          />
        </Field>
      </Section>

      <Section title="Variantes (versiones y precios)">
        <label className="flex items-start gap-3 p-3 border rounded bg-amber-50 cursor-pointer hover:bg-amber-100">
          <input
            type="checkbox"
            className="mt-1"
            checked={!!p.hideVariantSelector}
            onChange={(e) => setP((p) => (p.hideVariantSelector = e.target.checked))}
            data-testid="hide-variant-selector"
          />
          <div>
            <div className="font-semibold text-sm">Solo hay una versión (ocultar selector en la web)</div>
            <div className="text-xs text-slate-600">
              Marca esta casilla cuando el producto solo tenga UNA versión. La página del producto
              no mostrará el bloque &laquo;Versión:&raquo; con los recuadros, pero seguirás
              configurando aquí abajo el precio, el precio original y el stock de la única variante.
            </div>
          </div>
        </label>
        {(p.variants || []).map((v: AnyObj, i: number) => (
          <div key={i} className="border rounded p-3 space-y-2 bg-slate-50">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Field label="ID">
                <Text value={v.id} onChange={(x) => setP((p) => (p.variants[i].id = x))} />
              </Field>
              <Field label="Nombre">
                <Text value={v.name} onChange={(x) => setP((p) => (p.variants[i].name = x))} />
              </Field>
              <Field label="Precio €">
                <Num value={v.price} onChange={(x) => setP((p) => (p.variants[i].price = x))} />
              </Field>
              <Field label="Precio original €">
                <Num
                  value={v.originalPrice}
                  onChange={(x) => setP((p) => (p.variants[i].originalPrice = x))}
                />
              </Field>
              <Field label="Stock (uds. restantes)">
                <Num
                  value={v.stock}
                  onChange={(x) => setP((p) => (p.variants[i].stock = x))}
                />
              </Field>
            </div>
            <p className="text-[11px] text-slate-500 -mt-1">
              Si el stock es 5 o menos, aparece el aviso &laquo;Últimas X en oferta&raquo; en la
              ficha del producto. Deja vacío o 0 para no mostrar el aviso.
            </p>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!v.isBestSeller}
                  onChange={(e) => setP((p) => (p.variants[i].isBestSeller = e.target.checked))}
                />
                Más vendida
              </label>
              <RemoveBtn onClick={() => setP((p) => p.variants.splice(i, 1))} />
            </div>
          </div>
        ))}
        <AddBtn
          onClick={() =>
            setP((p) => {
              if (!p.variants) p.variants = [];
              p.variants.push({ id: 'nuevo', name: 'Nueva', price: 0, originalPrice: 0, stock: 10 });
            })
          }
        >
          + Añadir variante
        </AddBtn>
      </Section>

      <Section title="Colores">
        {(p.selectionOptions?.colors?.options || []).map((c: AnyObj, i: number) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
            <Field label="ID">
              <Text
                value={c.id}
                onChange={(v) => setP((p) => (p.selectionOptions.colors.options[i].id = v))}
              />
            </Field>
            <Field label="Nombre">
              <Text
                value={c.name}
                onChange={(v) => setP((p) => (p.selectionOptions.colors.options[i].name = v))}
              />
            </Field>
            <Field label="Imagen">
              <ImagePicker
                value={c.image}
                onChange={(v) => setP((p) => (p.selectionOptions.colors.options[i].image = v))}
              />
            </Field>
            <RemoveBtn onClick={() => setP((p) => p.selectionOptions.colors.options.splice(i, 1))} />
          </div>
        ))}
        <AddBtn
          onClick={() =>
            setP((p) => {
              if (!p.selectionOptions) p.selectionOptions = { colors: { label: 'COLOR', options: [] } };
              if (!p.selectionOptions.colors) p.selectionOptions.colors = { label: 'COLOR', options: [] };
              if (!p.selectionOptions.colors.options) p.selectionOptions.colors.options = [];
              p.selectionOptions.colors.options.push({
                id: 'nuevo',
                name: 'Nuevo',
                image: '/images/aa.png',
              });
            })
          }
        >
          + Añadir color
        </AddBtn>
      </Section>

      <Section title="Galería de imágenes">
        {(p.images || []).map((img: AnyObj, i: number) => (
          <div key={i} className="grid grid-cols-[2fr_1fr_auto] gap-2 items-end">
            <Field label={`Imagen ${i + 1}`}>
              <ImagePicker
                value={img.src}
                onChange={(v) => setP((p) => (p.images[i].src = v))}
              />
            </Field>
            <Field label="Alt">
              <Text value={img.alt} onChange={(v) => setP((p) => (p.images[i].alt = v))} />
            </Field>
            <RemoveBtn onClick={() => setP((p) => p.images.splice(i, 1))} />
          </div>
        ))}
        <AddBtn
          onClick={() =>
            setP((p) => {
              if (!p.images) p.images = [];
              p.images.push({
                id: `img-${Date.now()}`,
                src: '/images/aa.png',
                alt: '',
                hint: '',
              });
            })
          }
        >
          + Añadir imagen
        </AddBtn>
      </Section>

      <Section title="Beneficios de compra (con icono)">
        <PurchaseBenefitsEditor product={p} setP={setP} />
      </Section>

      <Section title="Qué incluye la caja">
        <div>
          {(p.whatsInTheBox || []).map((item: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <Text value={item} onChange={(v) => setP((p) => (p.whatsInTheBox[i] = v))} />
              <RemoveBtn onClick={() => setP((p) => p.whatsInTheBox.splice(i, 1))} />
            </div>
          ))}
          <AddBtn
            onClick={() =>
              setP((p) => {
                if (!p.whatsInTheBox) p.whatsInTheBox = [];
                p.whatsInTheBox.push('Nuevo item');
              })
            }
          >
            + Añadir item
          </AddBtn>
        </div>
      </Section>

      <Section title="Acordeón de información">
        {(['shipping', 'warranty', 'extra'] as const).map((key) => {
          const block = p.productInfoAccordion?.[key] || {};
          return (
            <div key={key} className="border rounded p-3 bg-slate-50 space-y-2">
              <p className="font-semibold capitalize">{key}</p>
              {Object.entries(block).map(([k, v]) => (
                <Field key={k} label={k}>
                  <TextArea
                    value={String(v)}
                    rows={2}
                    onChange={(val) =>
                      setP((p) => {
                        if (!p.productInfoAccordion) p.productInfoAccordion = {};
                        if (!p.productInfoAccordion[key]) p.productInfoAccordion[key] = {};
                        p.productInfoAccordion[key][k] = val;
                      })
                    }
                  />
                </Field>
              ))}
            </div>
          );
        })}
      </Section>

      <Section title="Countdown de oferta">
        <Field label="Texto activo (usa {timer})">
          <TextArea
            value={p.countdownOffer?.activeText || ''}
            onChange={(v) =>
              setP((p) => {
                if (!p.countdownOffer) p.countdownOffer = {};
                p.countdownOffer.activeText = v;
              })
            }
          />
        </Field>
        <Field label="Texto al expirar">
          <TextArea
            value={p.countdownOffer?.expiredText || ''}
            onChange={(v) =>
              setP((p) => {
                if (!p.countdownOffer) p.countdownOffer = {};
                p.countdownOffer.expiredText = v;
              })
            }
          />
        </Field>
      </Section>

      <CopyFeatureSectionsBlock product={p} setP={setP} allProducts={allProducts} editingIndex={editingIndex} />

      <FeatureSectionsEditor product={p} setP={setP} />

      <PlayersInActionEditor product={p} setP={setP} allProducts={allProducts} editingIndex={editingIndex} />

      <UpsellsEditor product={p} setP={setP} allProducts={allProducts} editingIndex={editingIndex} sc={sc} />
    </>
  );
}

function FeatureSectionsEditor({
  product,
  setP,
}: {
  product: AnyObj;
  setP: (mut: (p: AnyObj) => void) => void;
}) {
  // Unified view: prefer the new `featureSections` array; fall back to legacy single fields.
  const sections: AnyObj[] = (() => {
    if (Array.isArray(product.featureSections) && product.featureSections.length > 0) {
      return product.featureSections;
    }
    const legacy = [product.featureSection1, product.featureSection2].filter(Boolean) as AnyObj[];
    return legacy;
  })();

  // Helper that ensures the array exists on the product before mutating it,
  // and drops the now-redundant legacy fields.
  const mutateSections = (mut: (arr: AnyObj[]) => void) =>
    setP((p) => {
      if (!Array.isArray(p.featureSections)) {
        // Initialize from legacy fields the first time the user edits the array.
        const seed: AnyObj[] = [p.featureSection1, p.featureSection2].filter(Boolean) as AnyObj[];
        p.featureSections = seed.map((s) => clone(s));
      }
      mut(p.featureSections);
      // Mirror first two into legacy fields so any old code reading them still works.
      p.featureSection1 = p.featureSections[0] || undefined;
      p.featureSection2 = p.featureSections[1] || undefined;
    });

  return (
    <>
      <Section title={`Secciones destacadas (${sections.length})`}>
        <p className="text-xs text-slate-500 -mt-2">
          Cada sección se renderiza en la página del producto, alternando texto a la izquierda y
          a la derecha. Acepta imagen (.webp/.png/.jpg/.gif) o vídeo (.mp4/.webm/.mov).
        </p>

        {sections.map((section, idx) => (
          <div key={idx} className="border-2 rounded-lg p-4 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm">
                Sección destacada #{idx + 1}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  (texto a la {idx % 2 === 0 ? 'izquierda' : 'derecha'})
                </span>
              </h4>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() =>
                    mutateSections((arr) => {
                      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                    })
                  }
                  className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Subir sección"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === sections.length - 1}
                  onClick={() =>
                    mutateSections((arr) => {
                      [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]];
                    })
                  }
                  className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Bajar sección"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('¿Eliminar esta sección?')) return;
                    mutateSections((arr) => arr.splice(idx, 1));
                  }}
                  className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded bg-white hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <Field label="Título">
              <Text
                value={section.title || ''}
                onChange={(v) => mutateSections((arr) => (arr[idx].title = v))}
              />
            </Field>
            <Field label="Párrafos (separados por línea en blanco)">
              <TextArea
                rows={5}
                value={(section.paragraphs || []).join('\n\n')}
                onChange={(v) =>
                  mutateSections((arr) => {
                    arr[idx].paragraphs = v.split('\n\n').filter(Boolean);
                  })
                }
              />
            </Field>
            <Field label="Items lista (uno por línea)">
              <TextArea
                rows={3}
                value={(section.listItems || []).join('\n')}
                onChange={(v) =>
                  mutateSections((arr) => {
                    arr[idx].listItems = v.split('\n').filter(Boolean);
                  })
                }
              />
            </Field>
            <Field label="Imagen o vídeo">
              <ImagePicker
                value={section.imageSrc || ''}
                onChange={(v) => mutateSections((arr) => (arr[idx].imageSrc = v))}
              />
            </Field>
          </div>
        ))}

        <AddBtn
          onClick={() =>
            mutateSections((arr) =>
              arr.push({ title: 'Nueva sección', paragraphs: [], listItems: [], imageSrc: '' })
            )
          }
        >
          + Añadir sección destacada
        </AddBtn>
      </Section>
    </>
  );
}

function CopyFeatureSectionsBlock({
  product,
  setP,
  allProducts,
  editingIndex,
}: {
  product: AnyObj;
  setP: (mut: (p: AnyObj) => void) => void;
  allProducts: AnyObj[];
  editingIndex: number;
}) {
  const others = allProducts.filter((_, i) => i !== editingIndex);

  const [source, setSource] = useState<string>(others[0]?.id || '');

  if (others.length === 0) return null;

  // Build a unified list of feature sections from a source product (handles both
  // legacy fields and the new featureSections array).
  const collectSections = (src: AnyObj): AnyObj[] => {
    if (Array.isArray(src.featureSections) && src.featureSections.length > 0) {
      return src.featureSections;
    }
    return [src.featureSection1, src.featureSection2].filter(Boolean) as AnyObj[];
  };

  const apply = () => {
    const src = others.find((o) => o.id === source) || others[0];
    if (!src) return;
    const list = collectSections(src);
    if (list.length === 0) {
      alert('Ese producto no tiene secciones destacadas para copiar.');
      return;
    }
    if (
      !confirm(
        `¿Copiar ${list.length} sección(es) destacada(s) desde "${src.name}"? Se sobreescribirán las actuales.`
      )
    )
      return;
    setP((p) => {
      p.featureSections = list.map((s) => clone(s));
      // Mirror first two into legacy fields too.
      p.featureSection1 = p.featureSections[0] || undefined;
      p.featureSection2 = p.featureSections[1] || undefined;
    });
  };

  return (
    <Section title="↪ Copiar secciones destacadas desde otro producto">
      <p className="text-sm text-slate-600 -mt-2">
        Útil cuando creas un producto nuevo: clona TODAS las secciones destacadas (textos +
        imagen/vídeo) de otro producto y luego edítalas. La copia es independiente (no afecta al
        producto origen).
      </p>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_auto] gap-2 items-end">
        <Field label="Producto origen">
          <select
            value={source || others[0]?.id}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {others.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({collectSections(o).length} sección(es))
              </option>
            ))}
          </select>
        </Field>
        <button
          type="button"
          onClick={apply}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          Copiar todas las secciones
        </button>
      </div>
    </Section>
  );
}

/* ---------- Players in Action (per-product video carousel) ---------- */

function PlayersInActionEditor({
  product,
  setP,
  allProducts,
  editingIndex,
}: {
  product: AnyObj;
  setP: (mut: (p: AnyObj) => void) => void;
  allProducts: AnyObj[];
  editingIndex: number;
}) {
  const section: AnyObj = product.customerReviewsCarouselSection || {};
  const hasOverride = Array.isArray(product.customerReviewsCarouselSection?.videos);
  const videos: AnyObj[] = section.videos || [];
  const enabled = section.enabled !== false; // default true

  const ensureSection = (p: AnyObj) => {
    if (!p.customerReviewsCarouselSection) {
      p.customerReviewsCarouselSection = {
        enabled: true,
        title: 'Nuestros Jugadores en Acción',
        videos: [],
      };
    }
    if (!Array.isArray(p.customerReviewsCarouselSection.videos)) {
      p.customerReviewsCarouselSection.videos = [];
    }
    return p.customerReviewsCarouselSection;
  };

  const setSection = (mut: (s: AnyObj) => void) =>
    setP((p) => {
      const s = ensureSection(p);
      mut(s);
    });

  const setVideos = (mut: (arr: AnyObj[]) => void) =>
    setP((p) => {
      const s = ensureSection(p);
      mut(s.videos);
    });

  const others = allProducts.filter((_, i) => i !== editingIndex);
  const [copySource, setCopySource] = useState<string>(others[0]?.id || '');

  const copyFromOther = () => {
    const src = others.find((o) => o.id === copySource) || others[0];
    if (!src) return;
    const srcSection = src.customerReviewsCarouselSection || {};
    const srcVideos = Array.isArray(srcSection.videos) ? srcSection.videos : [];
    if (srcVideos.length === 0) {
      alert('Ese producto no tiene vídeos configurados para copiar.');
      return;
    }
    if (
      !confirm(
        `¿Copiar ${srcVideos.length} vídeo(s) desde "${src.name}"? Se sobreescribirán los actuales.`
      )
    )
      return;
    setP((p) => {
      ensureSection(p);
      p.customerReviewsCarouselSection.title =
        srcSection.title || p.customerReviewsCarouselSection.title;
      p.customerReviewsCarouselSection.videos = srcVideos.map((v: AnyObj) => clone(v));
    });
  };

  return (
    <Section title="🎬 Vídeos «Nuestros Jugadores en Acción» (por producto)">
      <p className="text-sm text-slate-600 -mt-2">
        Configura los vídeos verticales (formato 9:16, .mp4 / .webm / .mov) que se muestran en el
        carrusel debajo del bloque de información del producto. Cada producto tiene sus propios
        vídeos. Si dejas la lista vacía y desactivas la casilla, el carrusel no aparece en este
        producto.
      </p>

      <label className="flex items-start gap-3 p-3 border rounded bg-slate-50 cursor-pointer hover:bg-slate-100">
        <input
          type="checkbox"
          className="mt-1"
          checked={enabled}
          onChange={(e) => setSection((s) => (s.enabled = e.target.checked))}
          data-testid="players-in-action-enabled"
        />
        <div>
          <div className="font-semibold text-sm">Mostrar carrusel de vídeos en este producto</div>
          <div className="text-xs text-slate-600">
            Si lo desactivas, el bloque entero «Nuestros Jugadores en Acción» se oculta SOLO en
            este producto.
          </div>
        </div>
      </label>

      <Field label="Título de la sección">
        <Text
          value={section.title || ''}
          onChange={(v) => setSection((s) => (s.title = v))}
          testid="players-in-action-title"
        />
      </Field>

      {!hasOverride && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          Aún no has configurado vídeos específicos para este producto, así que se usan los vídeos
          globales por compatibilidad. En cuanto añadas o copies un vídeo aquí, este producto
          tendrá su propia lista independiente.
        </p>
      )}

      <div className="space-y-3">
        {videos.map((v, i) => (
          <div
            key={i}
            className="border-2 rounded-lg p-3 bg-slate-50 grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-3 items-end"
            data-testid={`player-video-row-${i}`}
          >
            <Field label={`Vídeo ${i + 1} (archivo)`}>
              <ImagePicker
                value={v.src || ''}
                onChange={(val) => setVideos((arr) => (arr[i].src = val))}
              />
            </Field>
            <Field label="Título / descripción (opcional)">
              <Text
                value={v.title || ''}
                onChange={(val) => setVideos((arr) => (arr[i].title = val))}
              />
            </Field>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() =>
                  setVideos((arr) => {
                    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                  })
                }
                className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Subir vídeo"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === videos.length - 1}
                onClick={() =>
                  setVideos((arr) => {
                    [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                  })
                }
                className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Bajar vídeo"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm('¿Eliminar este vídeo?')) return;
                  setVideos((arr) => arr.splice(i, 1));
                }}
                className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded bg-white hover:bg-red-50"
                data-testid={`delete-player-video-${i}`}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddBtn
        onClick={() =>
          setVideos((arr) =>
            arr.push({
              id: `vid-${Date.now()}`,
              src: '',
              title: '',
            })
          )
        }
      >
        + Añadir vídeo
      </AddBtn>

      {others.length > 0 && (
        <div className="mt-4 pt-4 border-t border-dashed">
          <p className="text-sm font-semibold mb-2">↪ Copiar vídeos desde otro producto</p>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_auto] gap-2 items-end">
            <Field label="Producto origen">
              <select
                value={copySource || others[0]?.id}
                onChange={(e) => setCopySource(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                data-testid="players-in-action-copy-source"
              >
                {others.map((o) => {
                  const cnt = Array.isArray(o.customerReviewsCarouselSection?.videos)
                    ? o.customerReviewsCarouselSection.videos.length
                    : 0;
                  return (
                    <option key={o.id} value={o.id}>
                      {o.name} ({cnt} vídeo(s))
                    </option>
                  );
                })}
              </select>
            </Field>
            <button
              type="button"
              onClick={copyFromOther}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
              data-testid="players-in-action-copy-btn"
            >
              Copiar vídeos
            </button>
          </div>
        </div>
      )}
    </Section>
  );
}

/* ---------- Purchase Benefits (per-product, with icon) ---------- */

const PURCHASE_BENEFIT_ICON_OPTIONS = [
  'Gift',
  'Gamepad2',
  'Tv',
  'ShieldCheck',
  'Truck',
  'Package',
  'Users',
  'Sparkles',
  'Star',
  'Trophy',
  'Heart',
  'Zap',
  'Wifi',
  'Headphones',
  'Music',
  'Video',
  'BatteryFull',
  'Plug',
  'Cpu',
  'Award',
  'BadgeCheck',
  'Lock',
  'Flame',
  'Rocket',
  'Crown',
  'CheckCircle2',
  'Gauge',
  'Smile',
] as const;

function PurchaseBenefitsEditor({
  product,
  setP,
}: {
  product: AnyObj;
  setP: (mut: (p: AnyObj) => void) => void;
}) {
  const pb: AnyObj = product.purchaseBenefits || {};
  const hasItems = Array.isArray(pb.items);

  // Build the list to display: prefer the new `items` array; otherwise migrate
  // legacy fields ({gifts, games, tv}) on the fly so the user can edit them.
  const items: AnyObj[] = hasItems
    ? pb.items
    : [
        pb.gifts ? { icon: 'Gift', text: pb.gifts } : null,
        pb.games ? { icon: 'Gamepad2', text: pb.games } : null,
        pb.tv ? { icon: 'Tv', text: pb.tv } : null,
      ].filter(Boolean);

  const ensureItems = (p: AnyObj) => {
    if (!p.purchaseBenefits) p.purchaseBenefits = {};
    if (!Array.isArray(p.purchaseBenefits.items)) {
      const seed: AnyObj[] = [];
      if (p.purchaseBenefits.gifts) seed.push({ icon: 'Gift', text: p.purchaseBenefits.gifts });
      if (p.purchaseBenefits.games) seed.push({ icon: 'Gamepad2', text: p.purchaseBenefits.games });
      if (p.purchaseBenefits.tv) seed.push({ icon: 'Tv', text: p.purchaseBenefits.tv });
      p.purchaseBenefits.items = seed;
    }
    return p.purchaseBenefits.items as AnyObj[];
  };

  const setItems = (mut: (arr: AnyObj[]) => void) =>
    setP((p) => {
      const arr = ensureItems(p);
      mut(arr);
      const get = (icon: string) => arr.find((it) => it?.icon === icon)?.text || '';
      p.purchaseBenefits.gifts = get('Gift');
      p.purchaseBenefits.games = get('Gamepad2');
      p.purchaseBenefits.tv = get('Tv');
    });

  return (
    <>
      <p className="text-sm text-slate-600 -mt-2">
        Edita las líneas con icono que aparecen en la ficha del producto debajo del countdown.
        Acepta HTML básico (<code>&lt;strong&gt;</code>, <code>&lt;b&gt;</code>) en el texto.
      </p>

      <div className="space-y-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="border-2 rounded-lg p-3 bg-slate-50 grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 items-end"
            data-testid={`purchase-benefit-row-${i}`}
          >
            <Field label="Icono">
              <select
                value={it.icon || 'Gift'}
                onChange={(e) => setItems((arr) => (arr[i].icon = e.target.value))}
                className="w-full border rounded px-3 py-2 text-sm"
                data-testid={`purchase-benefit-icon-${i}`}
              >
                {PURCHASE_BENEFIT_ICON_OPTIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Texto (acepta HTML)">
              <Text
                value={it.text || ''}
                onChange={(v) => setItems((arr) => (arr[i].text = v))}
                testid={`purchase-benefit-text-${i}`}
              />
            </Field>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={i === 0}
                onClick={() =>
                  setItems((arr) => {
                    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                  })
                }
                className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Subir"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={i === items.length - 1}
                onClick={() =>
                  setItems((arr) => {
                    [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                  })
                }
                className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Bajar"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm('¿Eliminar este beneficio?')) return;
                  setItems((arr) => arr.splice(i, 1));
                }}
                className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded bg-white hover:bg-red-50"
                data-testid={`delete-purchase-benefit-${i}`}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddBtn
        onClick={() =>
          setItems((arr) =>
            arr.push({
              icon: 'Sparkles',
              text: '<strong>Nuevo beneficio</strong>',
            })
          )
        }
      >
        + Añadir beneficio
      </AddBtn>
    </>
  );
}

/* ---------- Upsells editor (per-product cart upsells) ---------- */

function UpsellsEditor({
  product,
  setP,
  allProducts,
  editingIndex,
  sc,
}: {
  product: AnyObj;
  setP: (mut: (p: AnyObj) => void) => void;
  allProducts: AnyObj[];
  editingIndex: number;
  sc: AnyObj;
}) {
  const upsells: AnyObj[] = Array.isArray(product.upsells) ? product.upsells : [];
  const isConfigured = Array.isArray(product.upsells);
  const others = allProducts.filter((_, i) => i !== editingIndex);

  const ensureUpsells = (p: AnyObj) => {
    if (!Array.isArray(p.upsells)) p.upsells = [];
    return p.upsells as AnyObj[];
  };

  const setUpsells = (mut: (arr: AnyObj[]) => void) =>
    setP((p) => {
      const arr = ensureUpsells(p);
      mut(arr);
    });

  const initWithCommunity = () => {
    const communitySection = sc?.homePage?.communitySection || {};
    setP((p) => {
      p.upsells = [
        {
          id: `upsell-${Date.now()}`,
          enabled: true,
          name: '1 Año de Acceso a la Comunidad',
          image: communitySection.cartImage || '/images/aa.png',
          price: 0,
          label: 'GRATIS',
        },
      ];
    });
  };

  const initEmpty = () => {
    setP((p) => {
      p.upsells = [];
    });
  };

  const addCustomUpsell = () => {
    setUpsells((arr) =>
      arr.push({
        id: `upsell-${Date.now()}`,
        enabled: true,
        name: 'Nuevo upsell',
        image: '/images/aa.png',
        price: 0,
        label: 'GRATIS',
      })
    );
  };

  const addUpsellFromProduct = (slug: string) => {
    const src = others.find((o) => o.slug === slug);
    if (!src) return;
    const variant = (src.variants || []).find((v: AnyObj) => v.isBestSeller) || src.variants?.[0] || {};
    setUpsells((arr) =>
      arr.push({
        id: `upsell-${Date.now()}`,
        enabled: true,
        name: src.name,
        image: src.cartImage || src.images?.[0]?.src || '/images/aa.png',
        price: typeof variant.price === 'number' ? variant.price : 0,
        label: '',
        sourceProductSlug: src.slug,
      })
    );
  };

  if (!isConfigured) {
    return (
      <Section title="🎁 Upsells del carrito (por producto)">
        <p className="text-sm text-slate-600 -mt-2">
          Por ahora este producto usa el upsell global por defecto (
          <strong>1 Año de Acceso a la Comunidad</strong> gratis), que se añade automáticamente al
          carrito al meter este producto. Si quieres editar el texto/imagen, añadir más upsells, o
          desactivarlo solo en este producto, configúralo aquí abajo.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={initWithCommunity}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
            data-testid="upsells-init-with-community"
          >
            Configurar upsells (partir del actual)
          </button>
          <button
            type="button"
            onClick={initEmpty}
            className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded text-sm font-medium"
            data-testid="upsells-init-empty"
          >
            Configurar sin ningún upsell
          </button>
        </div>
      </Section>
    );
  }

  return (
    <Section title={`🎁 Upsells del carrito (${upsells.length})`}>
      <p className="text-sm text-slate-600 -mt-2">
        Estos extras se añaden automáticamente al carrito cuando un cliente compra este producto.
        Puedes desactivarlos individualmente, editar el texto, la imagen y el precio (0 € = gratis),
        o usar otro producto como upsell.
      </p>

      <div className="space-y-3">
        {upsells.map((u, i) => (
          <div
            key={i}
            className="border-2 rounded-lg p-4 bg-slate-50 space-y-3"
            data-testid={`upsell-row-${i}`}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={u.enabled !== false}
                  onChange={(e) => setUpsells((arr) => (arr[i].enabled = e.target.checked))}
                  data-testid={`upsell-enabled-${i}`}
                />
                Activo (se añade automáticamente al carrito)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={i === 0}
                  onClick={() =>
                    setUpsells((arr) => {
                      [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
                    })
                  }
                  className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Subir"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={i === upsells.length - 1}
                  onClick={() =>
                    setUpsells((arr) => {
                      [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
                    })
                  }
                  className="text-xs px-2 py-1 border rounded bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Bajar"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('¿Eliminar este upsell?')) return;
                    setUpsells((arr) => arr.splice(i, 1));
                  }}
                  className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded bg-white hover:bg-red-50"
                  data-testid={`delete-upsell-${i}`}
                >
                  Eliminar
                </button>
              </div>
            </div>

            <Field label="Nombre (lo que verá el cliente en el carrito)">
              <Text
                value={u.name || ''}
                onChange={(v) => setUpsells((arr) => (arr[i].name = v))}
                testid={`upsell-name-${i}`}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-3">
              <Field label="Imagen">
                <ImagePicker
                  value={u.image || ''}
                  onChange={(v) => setUpsells((arr) => (arr[i].image = v))}
                />
              </Field>
              <Field label="Precio € (0 = GRATIS)">
                <Num
                  value={typeof u.price === 'number' ? u.price : 0}
                  onChange={(v) => setUpsells((arr) => (arr[i].price = v))}
                  testid={`upsell-price-${i}`}
                />
              </Field>
              <Field label="Etiqueta (badge en el carrito)">
                <Text
                  value={u.label || ''}
                  onChange={(v) => setUpsells((arr) => (arr[i].label = v))}
                  testid={`upsell-label-${i}`}
                />
              </Field>
            </div>

            {u.sourceProductSlug && (
              <p className="text-[11px] text-slate-500">
                Vinculado al producto <code>/producto/{u.sourceProductSlug}</code>
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={addCustomUpsell}
          className="bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded text-sm font-medium"
          data-testid="add-custom-upsell"
        >
          + Añadir upsell personalizado
        </button>

        {others.length > 0 && (
          <div className="inline-flex items-stretch border rounded overflow-hidden">
            <select
              id={`add-upsell-from-product-${editingIndex}`}
              defaultValue=""
              className="px-3 py-2 text-sm bg-white border-r"
              data-testid="add-upsell-from-product-select"
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                addUpsellFromProduct(v);
                e.target.value = '';
              }}
            >
              <option value="">+ Añadir otro producto como upsell…</option>
              {others.map((o) => (
                <option key={o.slug} value={o.slug}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
        ⚠️ Estos upsells solo se añaden si el carrito estaba vacío justo antes de añadir este
        producto (mismo comportamiento del upsell original). Esto evita duplicados cuando el
        cliente añade varios productos.
      </div>
    </Section>
  );
}







function MenuTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const menu: AnyObj[] = sc.menu || [];
  const setM = (mut: (arr: AnyObj[]) => void) =>
    update((d) => {
      if (!d.siteContent.menu) d.siteContent.menu = [];
      mut(d.siteContent.menu);
    });

  const products: AnyObj[] = sc.products || [];

  return (
    <Section title={`Menú de navegación (${menu.length})`}>
      <p className="text-sm text-slate-600">
        Estos enlaces aparecen en el header (y en el menú móvil). Puedes enlazar a páginas
        internas o a productos concretos (<code>/producto/slug</code>).
      </p>
      <div className="space-y-2 mt-4">
        {menu.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end bg-slate-50 border rounded p-3">
            <Field label={`Texto ${i + 1}`}>
              <Text value={item.text} onChange={(v) => setM((a) => (a[i].text = v))} />
            </Field>
            <Field label="URL / Ruta">
              <Text value={item.href} onChange={(v) => setM((a) => (a[i].href = v))} />
            </Field>
            <RemoveBtn onClick={() => setM((a) => a.splice(i, 1))} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        <AddBtn onClick={() => setM((a) => a.push({ text: 'Nuevo', href: '/' }))}>
          + Añadir enlace
        </AddBtn>
        {products.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() =>
              setM((a) => a.push({ text: p.name, href: `/producto/${p.slug}` }))
            }
            className="bg-blue-100 hover:bg-blue-200 text-blue-900 px-3 py-2 rounded text-sm"
            data-testid={`add-menu-product-${p.slug}`}
          >
            + {p.name}
          </button>
        ))}
      </div>
    </Section>
  );
}


function HomeTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const h = sc.homePage;
  const setH = (mut: (h: AnyObj) => void) => update((d) => mut(d.siteContent.homePage));
  const banner = sc.heroBanner || {};
  const setB = (mut: (b: AnyObj) => void) =>
    update((d) => {
      if (!d.siteContent.heroBanner) d.siteContent.heroBanner = {};
      mut(d.siteContent.heroBanner);
    });
  return (
    <>
      <Section title="Banner principal de la home (hero)">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={banner.enabled !== false}
            onChange={(e) => setB((b) => (b.enabled = e.target.checked))}
            data-testid="hero-banner-enabled"
          />
          Mostrar banner en la home
        </label>
        <Field label="Imagen del banner (fondo)">
          <ImagePicker
            value={banner.image || ''}
            onChange={(v) => setB((b) => (b.image = v))}
          />
        </Field>
        <Field label="Título grande (opcional)">
          <Text
            value={banner.title || ''}
            onChange={(v) => setB((b) => (b.title = v))}
          />
        </Field>
        <Field label="Subtítulo (opcional)">
          <Text
            value={banner.subtitle || ''}
            onChange={(v) => setB((b) => (b.subtitle = v))}
          />
        </Field>
      </Section>

      <Section title="Hero interno (imagen entre secciones)">
        <p className="text-sm text-slate-600 -mt-2">
          Es la imagen larga (típicamente la de &laquo;emuladores compatibles&raquo;) que se muestra
          en la página del producto, justo encima de la galería. Desactiva el check para
          ocultarla por completo.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={h.heroImageEnabled !== false}
            onChange={(e) => setH((h) => (h.heroImageEnabled = e.target.checked))}
            data-testid="hero-image-enabled"
          />
          Mostrar la imagen de emuladores en la página de producto
        </label>
        <Field label="Imagen (emuladores etc.)">
          <ImagePicker value={h.heroImage} onChange={(v) => setH((h) => (h.heroImage = v))} />
        </Field>
      </Section>

      <Section title="Sección comunidad (dentro del home)">
        <Field label="Título">
          <Text
            value={h.communitySection?.title || ''}
            onChange={(v) => setH((h) => (h.communitySection.title = v))}
          />
        </Field>
        <Field label="Descripción">
          <TextArea
            value={h.communitySection?.description || ''}
            onChange={(v) => setH((h) => (h.communitySection.description = v))}
          />
        </Field>
        <Field label="Texto del botón">
          <Text
            value={h.communitySection?.buttonText || ''}
            onChange={(v) => setH((h) => (h.communitySection.buttonText = v))}
          />
        </Field>
        <Field label="Enlace del botón">
          <Text
            value={h.communitySection?.buttonLink || ''}
            onChange={(v) => setH((h) => (h.communitySection.buttonLink = v))}
          />
        </Field>
        <Field label="Imagen upsell carrito">
          <ImagePicker
            value={h.communitySection?.cartImage || ''}
            onChange={(v) => setH((h) => (h.communitySection.cartImage = v))}
          />
        </Field>
      </Section>

      <Section title="Reviews carrusel (títulos)">
        <Field label="Título de la sección">
          <Text
            value={h.customerReviewsCarouselSection?.title || ''}
            onChange={(v) => setH((h) => (h.customerReviewsCarouselSection.title = v))}
          />
        </Field>
      </Section>
    </>
  );
}

function ReviewsTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const reviews = sc.homePage.reviewsSection?.reviews || [];
  const reviewsEnabled = sc.homePage.reviewsSection?.enabled !== false; // default true
  const carouselEnabled = sc.homePage.customerReviewsCarouselSection?.enabled !== false; // default true
  const setR = (mut: (arr: AnyObj[]) => void) =>
    update((d) => mut(d.siteContent.homePage.reviewsSection.reviews));

  return (
    <>
      <Section title="Mostrar / ocultar valoraciones">
        <p className="text-sm text-slate-600 -mt-2">
          Activa o desactiva las dos secciones de valoraciones que aparecen en la página del
          producto. Si las desactivas, no se muestra absolutamente nada (ni el bloque, ni el
          título, ni el botón de &laquo;Escribir reseña&raquo;). Los datos se conservan, solo se ocultan.
        </p>
        <div className="space-y-3 mt-3">
          <label className="flex items-start gap-3 p-3 border rounded bg-slate-50 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              className="mt-1"
              checked={reviewsEnabled}
              onChange={(e) =>
                update((d) => {
                  if (!d.siteContent.homePage.reviewsSection) d.siteContent.homePage.reviewsSection = {};
                  d.siteContent.homePage.reviewsSection.enabled = e.target.checked;
                })
              }
            />
            <div>
              <div className="font-semibold text-sm">Mostrar bloque de reseñas escritas</div>
              <div className="text-xs text-slate-600">
                El bloque grande con las reseñas de texto, estrellas e imágenes que aparece debajo
                de la galería del producto.
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border rounded bg-slate-50 cursor-pointer hover:bg-slate-100">
            <input
              type="checkbox"
              className="mt-1"
              checked={carouselEnabled}
              onChange={(e) =>
                update((d) => {
                  if (!d.siteContent.homePage.customerReviewsCarouselSection)
                    d.siteContent.homePage.customerReviewsCarouselSection = {};
                  d.siteContent.homePage.customerReviewsCarouselSection.enabled = e.target.checked;
                })
              }
            />
            <div>
              <div className="font-semibold text-sm">Mostrar carrusel de vídeos de clientes</div>
              <div className="text-xs text-slate-600">
                El carrusel &laquo;Nuestros Jugadores en Acción&raquo; con los vídeos cortos.
              </div>
            </div>
          </label>
        </div>
      </Section>

    <Section title={`Reviews (${reviews.length})`}>
      <Field label="Título de la sección">
        <Text
          value={sc.homePage.reviewsSection?.title || ''}
          onChange={(v) => update((d) => (d.siteContent.homePage.reviewsSection.title = v))}
        />
      </Field>
      <div className="space-y-3 mt-4">
        {reviews.map((r: AnyObj, i: number) => (
          <div key={i} className="border rounded p-3 bg-slate-50 space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <Field label="Nombre">
                <Text value={r.name} onChange={(v) => setR((a) => (a[i].name = v))} />
              </Field>
              <Field label="Fecha">
                <Text value={r.date} onChange={(v) => setR((a) => (a[i].date = v))} />
              </Field>
              <Field label="Rating (1-5)">
                <Num value={r.rating} onChange={(v) => setR((a) => (a[i].rating = v))} />
              </Field>
              <div className="flex items-end">
                <RemoveBtn onClick={() => setR((a) => a.splice(i, 1))} />
              </div>
            </div>
            <Field label="Texto">
              <TextArea value={r.text} onChange={(v) => setR((a) => (a[i].text = v))} />
            </Field>
            <div className="grid grid-cols-[2fr_auto] gap-2 items-end">
              <Field label="Imagen">
                <ImagePicker value={r.image} onChange={(v) => setR((a) => (a[i].image = v))} />
              </Field>
              <label className="flex items-center gap-2 text-sm pb-2">
                <input
                  type="checkbox"
                  checked={!!r.isVerified}
                  onChange={(e) => setR((a) => (a[i].isVerified = e.target.checked))}
                />
                Verificada
              </label>
            </div>
          </div>
        ))}
      </div>
      <AddBtn
        onClick={() =>
          setR((a) =>
            a.push({
              id: String(Date.now()),
              name: 'Cliente',
              date: new Date().toLocaleDateString('es-ES'),
              rating: 5,
              text: '',
              isVerified: true,
              image: '/images/aa.png',
            })
          )
        }
      >
        + Añadir review
      </AddBtn>
    </Section>
    </>
  );
}

function FaqTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const faqs = sc.homePage.faqSection?.faqs || [];
  const setF = (mut: (arr: AnyObj[]) => void) =>
    update((d) => mut(d.siteContent.homePage.faqSection.faqs));

  return (
    <Section title={`Preguntas frecuentes (${faqs.length})`}>
      <Field label="Título de la sección">
        <Text
          value={sc.homePage.faqSection?.title || ''}
          onChange={(v) => update((d) => (d.siteContent.homePage.faqSection.title = v))}
        />
      </Field>
      <Field label="Imagen superior (encima de las preguntas)">
        <ImagePicker
          value={sc.homePage.faqSection?.image || ''}
          onChange={(v) =>
            update((d) => {
              if (!d.siteContent.homePage.faqSection) d.siteContent.homePage.faqSection = {};
              d.siteContent.homePage.faqSection.image = v;
            })
          }
        />
      </Field>
      <div className="space-y-3 mt-4">
        {faqs.map((q: AnyObj, i: number) => (
          <div key={i} className="border rounded p-3 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Pregunta {i + 1}</p>
              <RemoveBtn onClick={() => setF((a) => a.splice(i, 1))} />
            </div>
            <Field label="Pregunta">
              <Text
                value={q.question || q.q || ''}
                onChange={(v) =>
                  setF((a) => {
                    if ('question' in a[i]) a[i].question = v;
                    else a[i].q = v;
                  })
                }
              />
            </Field>
            <Field label="Respuesta">
              <TextArea
                rows={3}
                value={q.answer || q.a || ''}
                onChange={(v) =>
                  setF((a) => {
                    if ('answer' in a[i]) a[i].answer = v;
                    else a[i].a = v;
                  })
                }
              />
            </Field>
          </div>
        ))}
      </div>
      <AddBtn
        onClick={() =>
          setF((a) => a.push({ question: 'Nueva pregunta', answer: 'Respuesta' }))
        }
      >
        + Añadir pregunta
      </AddBtn>
    </Section>
  );
}

function CouponsTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const coupons: AnyObj[] = sc.coupons || [];
  const setC = (mut: (arr: AnyObj[]) => void) =>
    update((d) => {
      if (!d.siteContent.coupons) d.siteContent.coupons = [];
      mut(d.siteContent.coupons);
    });

  return (
    <Section title={`Cupones de descuento (${coupons.length})`}>
      <p className="text-sm text-slate-600">
        <strong>Tipos disponibles:</strong>
        <br />
        • <code>finalPrice</code>: el total pasa a ser el valor indicado (ej. 1€)
        <br />
        • <code>amountOff</code>: resta el valor al total (ej. -10€)
        <br />
        • <code>percentOff</code>: descuento porcentual (valor de 0 a 100, ej. 15 = -15%)
        <br />• <code>free</code>: el pedido es gratis
      </p>
      <div className="space-y-3 mt-4">
        {coupons.map((c, i) => (
          <div key={i} className="border rounded p-3 bg-slate-50">
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <Field label="Código">
                <Text
                  value={c.code || ''}
                  onChange={(v) => setC((a) => (a[i].code = v.toLowerCase()))}
                />
              </Field>
              <Field label="Tipo">
                <select
                  value={c.type || 'amountOff'}
                  onChange={(e) => setC((a) => (a[i].type = e.target.value))}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="finalPrice">finalPrice</option>
                  <option value="amountOff">amountOff</option>
                  <option value="percentOff">percentOff</option>
                  <option value="free">free</option>
                </select>
              </Field>
              <Field label={c.type === 'percentOff' ? 'Valor (% 0-100)' : 'Valor €'}>
                <Num
                  value={c.value || 0}
                  onChange={(v) => setC((a) => (a[i].value = v))}
                />
              </Field>
              <div className="flex items-end">
                <RemoveBtn onClick={() => setC((a) => a.splice(i, 1))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Field label="Título del toast">
                <Text
                  value={c.title || ''}
                  onChange={(v) => setC((a) => (a[i].title = v))}
                />
              </Field>
              <Field label="Descripción del toast">
                <Text
                  value={c.description || ''}
                  onChange={(v) => setC((a) => (a[i].description = v))}
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
      <AddBtn
        onClick={() =>
          setC((a) =>
            a.push({
              code: 'nuevo',
              type: 'amountOff',
              value: 10,
              title: '¡Cupón aplicado!',
              description: 'Has conseguido un descuento.',
            })
          )
        }
      >
        + Añadir cupón
      </AddBtn>
    </Section>
  );
}

function ImagesTab() {
  return (
    <Section title="Subir y explorar imágenes">
      <p className="text-sm text-slate-600">
        Todas las imágenes se guardan en <code>/public/images/</code>. Desde cualquier campo de
        imagen del admin puedes abrir el selector y subir nuevas. Aquí tienes una vista rápida:
      </p>
      <ImagePicker
        value=""
        onChange={() => {}}
        label="Abrir explorador de imágenes"
      />
    </Section>
  );
}

function ColorField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#000000';
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 border rounded cursor-pointer"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border rounded px-3 py-2 text-sm font-mono"
          placeholder="#1B7693"
        />
      </div>
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}

function ThemeTab({ sc, update }: { sc: AnyObj; update: (fn: (d: AnyObj) => void) => void }) {
  const theme = sc.theme || {};
  const setT = (key: string, value: string) =>
    update((d) => {
      if (!d.siteContent.theme) d.siteContent.theme = {};
      d.siteContent.theme[key] = value;
    });

  const reset = () =>
    update((d) => {
      d.siteContent.theme = {
        primary: '#1B7693',
        accent: '#2EA85C',
        announcementBg: '#000000',
      };
    });

  return (
    <Section title="Tema y colores">
      <p className="text-sm text-slate-600">
        Personaliza los colores principales del sitio. Los cambios se aplican tras pulsar
        &laquo;Guardar cambios&raquo; arriba.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <ColorField
          label="Color principal (botones, header, links)"
          value={theme.primary || '#1B7693'}
          onChange={(v) => setT('primary', v)}
          hint="Sustituye al teal por defecto. Afecta a la cabecera, botones primarios y anillos de selección."
        />
        <ColorField
          label="Color de acento (badges, contador del carrito)"
          value={theme.accent || '#2EA85C'}
          onChange={(v) => setT('accent', v)}
          hint="Color secundario destacado: badge 'Más vendida', contador del carrito, etc."
        />
        <ColorField
          label="Fondo de la barra de anuncios"
          value={theme.announcementBg || '#000000'}
          onChange={(v) => setT('announcementBg', v)}
          hint="Color de la franja superior con el mensaje promocional. Usa colores oscuros para contraste con el texto blanco."
        />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="text-sm text-slate-600 underline hover:text-slate-900"
        >
          Restablecer valores por defecto
        </button>
      </div>

      <div className="mt-6 rounded-lg border bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Vista previa</p>
        <div className="space-y-3">
          <div
            className="rounded px-3 py-2 text-white text-sm font-bold"
            style={{ backgroundColor: theme.announcementBg || '#000000' }}
          >
            🤍 Mensaje de la barra de anuncios
          </div>
          <div
            className="rounded px-4 py-3 text-white font-semibold flex items-center justify-between"
            style={{ backgroundColor: theme.primary || '#1B7693' }}
          >
            <span>Cabecera y botones primarios</span>
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
              style={{ backgroundColor: theme.accent || '#2EA85C' }}
            >
              3
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

