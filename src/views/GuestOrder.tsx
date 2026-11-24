import { useMemo, useState } from 'react'
import { calcTotals, deductStock, fmt, nextOrderNumber, useStore } from '../store'
import { FoodImg, Modal, SearchInput } from '../components'
import type { Order, OrderItem, Product } from '../types'

const GUEST_MESSAGES: Record<string, { title: string; sub: string }> = {
  new: { title: 'Order received', sub: 'Your order has reached the kitchen.' },
  accepted: { title: 'Your order has been accepted', sub: 'The kitchen has accepted your order.' },
  preparing: { title: 'Your food is being prepared', sub: 'Our chefs are on it right now.' },
  ready: { title: 'Order is ready to serve — your order is on its way', sub: 'Please wait a moment, it is coming to your table.' },
  served: { title: 'Delivered — enjoy your meal', sub: 'Your order has been served.' },
  completed: { title: 'Delivered — enjoy your meal', sub: 'Your order has been served.' },
}

const STEP_ORDER = ['new', 'accepted', 'preparing', 'ready', 'served'] as const
const STEP_LABELS = ['Received', 'Accepted', 'Preparing', 'Ready to serve', 'Delivered']

interface CartLine {
  key: string; product: Product; variation: string; delta: number
  modifiers: string[]; modTotal: number; qty: number; notes: string
}

/** ETA for an order = the longest prep time among its items. */
export function orderEta(items: OrderItem[], products: Product[]): number {
  if (items.length === 0) return 0
  return Math.max(0, ...items.map(it => products.find(p => p.id === it.productId)?.prepMins ?? 0))
}

export default function GuestOrder({ tableLabel }: { tableLabel: string }) {
  const { db, update } = useStore()
  const [cat, setCat] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [customize, setCustomize] = useState<Product | null>(null)
  const [varSel, setVarSel] = useState('')
  const [modSel, setModSel] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [guestName, setGuestName] = useState('')
  const [trackingId, setTrackingId] = useState<number | null>(null)
  const [addingMore, setAddingMore] = useState(false)

  const cur = db.settings.currency
  const table = db.tables.find(t => t.label === tableLabel)
  // The table's open bill: latest pending, unpaid order on this table from
  // TODAY. (Demo seed data contains old pending orders from past days —
  // those are history, not a live tab, so they must not be merged into.)
  const todayStr = new Date().toISOString().slice(0, 10)
  const openOrder = db.orders.find(o => o.tableLabel === tableLabel && o.status === 'pending' && o.paymentStatus !== 'paid' && o.createdAt.slice(0, 10) === todayStr)
  const tracked = trackingId ? db.orders.find(o => o.id === trackingId) : undefined

  const products = useMemo(() => db.products.filter(p =>
    p.available && (cat === null || p.categoryId === cat) &&
    (q === '' || p.name.toLowerCase().includes(q.toLowerCase()))), [db.products, cat, q])

  function cartItems(): OrderItem[] {
    return cart.map(c => ({
      productId: c.product.id, name: c.product.name, qty: c.qty,
      unitPrice: c.product.price + c.delta + c.modTotal, variation: c.variation,
      modifiers: c.modifiers.join(', '), notes: c.notes,
    }))
  }
  const cartTotals = calcTotals(cartItems(), 0, db.settings.taxRate, 0, db.settings.serviceRate)

  function pushLine(p: Product, variation: string, delta: number, mods: string[], modTotal: number, note: string) {
    const key = `${p.id}|${variation}|${mods.join('+')}|${note}`
    setCart(prev => {
      const ex = prev.find(c => c.key === key)
      if (ex) return prev.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { key, product: p, variation, delta, modifiers: mods, modTotal, qty: 1, notes: note }]
    })
    setCustomize(null)
  }

  function addToCart(p: Product) {
    if (p.variations.length || db.modifiers.length) {
      setCustomize(p); setVarSel(p.variations[0]?.name || ''); setModSel([]); setNotes('')
      return
    }
    pushLine(p, '', 0, [], 0, '')
  }

  function placeOrder() {
    if (cart.length === 0) return
    const items = cartItems()
    const name = guestName.trim() || `Table ${tableLabel} guest`
    if (openOrder) {
      // Merge into the SAME open order / bill — no second order while one is pending.
      const merged = openOrder.items.map(i => ({ ...i }))
      for (const it of items) {
        const ex = merged.find(m => m.productId === it.productId && m.variation === it.variation && m.modifiers === it.modifiers && m.notes === it.notes)
        if (ex) ex.qty += it.qty
        else merged.push({ ...it })
      }
      const totals = calcTotals(merged, 0, db.settings.taxRate, 0, db.settings.serviceRate)
      update(d => {
        let next = deductStock(d, items)
        // Back to 'new' so the kitchen bell rings for the add-on.
        next = { ...next, orders: next.orders.map(o => o.id === openOrder.id ? { ...o, items: merged, subtotal: totals.subtotal, discount: 0, tax: totals.tax, serviceCharge: totals.serviceCharge, total: totals.total, kitchenStatus: 'new' as const } : o) }
        return next
      }, `Table ${tableLabel} added items to ${openOrder.number}`)
      setCart([]); setAddingMore(false); setTrackingId(openOrder.id)
      return
    }
    const number = nextOrderNumber(db)
    const totals = calcTotals(items, 0, db.settings.taxRate, 0, db.settings.serviceRate)
    const id = Date.now()
    const order: Order = {
      id, number, type: 'dine_in', status: 'pending', kitchenStatus: 'new',
      customerId: null, customerName: name, waiterName: 'QR Guest', tableLabel,
      items, subtotal: totals.subtotal, discount: 0, tax: totals.tax,
      serviceCharge: totals.serviceCharge, deliveryFee: 0, total: totals.total,
      paidAmount: 0, paymentStatus: 'unpaid', payments: [],
      createdAt: new Date().toISOString(), notes: '', cancelReason: '', source: 'pos',
    }
    update(d => {
      let next = deductStock(d, items)
      next = {
        ...next,
        orders: [order, ...next.orders],
        tables: next.tables.map(t => t.label === tableLabel ? { ...t, status: 'occupied' as const } : t),
        notifications: [{ id: Date.now(), text: `New QR order ${number} from Table ${tableLabel} — ${fmt(totals.total, cur)}`, kind: 'order', read: false, at: new Date().toISOString() }, ...next.notifications].slice(0, 50),
      }
      return next
    }, `QR order ${number} from Table ${tableLabel} (${fmt(totals.total, cur)})`)
    setCart([]); setAddingMore(false); setTrackingId(id)
  }

  // ---- Table not found ----
  if (!table) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-md text-center anim-fade-up">
          <div className="text-4xl mb-3">🍔</div>
          <h1 className="text-xl font-extrabold">Table {tableLabel} not found</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Please scan the QR code on your table again, or ask a staff member for help.</p>
        </div>
      </div>
    )
  }

  // ---- Order tracking screen ----
  if (tracked && !addingMore) {
    const msg = GUEST_MESSAGES[tracked.kitchenStatus] || GUEST_MESSAGES.new
    const eta = orderEta(tracked.items, db.products)
    const stepKey = tracked.kitchenStatus === 'completed' ? 'served' : tracked.kitchenStatus
    const stepIdx = Math.max(0, (STEP_ORDER as readonly string[]).indexOf(stepKey))
    return (
      <div className="min-h-screen p-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-lg mx-auto space-y-4">
          <div className="text-center pt-4">
            <div className="text-3xl">🍔</div>
            <b className="text-lg">Urban Bites</b>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>Table {tableLabel} · Order {tracked.number}</div>
          </div>
          <div className="card p-5 text-center anim-pop" style={{ borderTop: '4px solid var(--accent)' }}>
            <div className="text-4xl mb-2">{tracked.kitchenStatus === 'ready' ? '🛎️' : tracked.kitchenStatus === 'served' || tracked.kitchenStatus === 'completed' ? '✅' : '👨‍🍳'}</div>
            <h1 className="text-xl font-extrabold">{msg.title}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{msg.sub}</p>
            {tracked.kitchenStatus !== 'served' && tracked.kitchenStatus !== 'completed' && (
              <div className="mt-4">
                <div className="text-3xl font-extrabold" style={{ color: 'var(--accent)' }}>~{eta} min</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Your order will arrive in about {eta} minutes</div>
              </div>
            )}
          </div>
          <div className="card p-4">
            <div className="flex justify-between text-xs mb-3">
              {STEP_LABELS.map((s, i) => (
                <div key={s} className="flex-1 text-center">
                  <div className="w-6 h-6 mx-auto rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: i <= stepIdx ? 'var(--accent)' : 'var(--surface2)', color: i <= stepIdx ? '#fff' : 'var(--muted)' }}>
                    {i <= stepIdx ? '✓' : i + 1}
                  </div>
                  <div className="mt-1" style={{ color: i <= stepIdx ? 'var(--text)' : 'var(--muted)' }}>{s}</div>
                </div>
              ))}
            </div>
            <div className="space-y-1 text-sm border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              {tracked.items.map((it, i) => (
                <div key={i} className="flex justify-between"><span>{it.qty} × {it.name} {it.variation && `(${it.variation})`}</span><span>{fmt(it.unitPrice * it.qty, cur)}</span></div>
              ))}
              <div className="flex justify-between pt-2 border-t font-extrabold" style={{ borderColor: 'var(--border)' }}><span>Total (same bill)</span><span>{fmt(tracked.total, cur)}</span></div>
            </div>
          </div>
          {tracked.status === 'pending' && (
            <button className="btn btn-primary w-full !py-3" onClick={() => setAddingMore(true)}>+ Add more items to this order</button>
          )}
          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            Your bill stays open on Table {tableLabel} — order more any time, pay once at the end. Please pay at the counter.
          </p>
        </div>
      </div>
    )
  }

  // ---- Menu / ordering screen ----
  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>
      <header className="p-4 text-center sticky top-0 z-40" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="text-2xl">🍔</div>
        <b className="text-lg">Urban Bites</b>
        <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>You are ordering from Table {tableLabel}</div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>No waiter needed — order from your phone, pay at the counter</div>
      </header>
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {openOrder && !addingMore && (
          <div className="card p-4 flex flex-wrap justify-between items-center gap-2 anim-fade-up" style={{ borderColor: 'var(--accent)', borderWidth: 2 }}>
            <span className="text-sm">You have an open order <b>{openOrder.number}</b> on this table — <b>{fmt(openOrder.total, cur)}</b></span>
            <button className="btn btn-primary !py-1" onClick={() => setTrackingId(openOrder.id)}>Track order</button>
          </div>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex-1 min-w-[200px]"><SearchInput value={q} onChange={setQ} placeholder="Search food…" /></div>
          <button className={`btn ${cat === null ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(null)}>All</button>
          {db.categories.map(c => (
            <button key={c.id} className={`btn ${cat === c.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c.id)}>{c.name}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map(p => (
            <button key={p.id} onClick={() => addToCart(p)}
              className="card card-hover text-left overflow-hidden anim-fade-up">
              <FoodImg src={p.image} alt={p.name} className="w-full h-28 object-cover" />
              <div className="p-3">
                <div className="font-bold text-sm leading-tight">{p.name}</div>
                <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{p.description}</div>
                <div className="flex justify-between items-center mt-2">
                  <b style={{ color: 'var(--accent)' }}>{fmt(p.price, cur)}</b>
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>~{p.prepMins} min</span>
                </div>
              </div>
            </button>
          ))}
          {products.length === 0 && <p className="col-span-full text-sm" style={{ color: 'var(--muted)' }}>No items match your search.</p>}
        </div>

        {cart.length > 0 && (
          <div className="card p-4 anim-fade-up">
            <h3 className="font-bold mb-3">Your order</h3>
            <div className="space-y-2">
              {cart.map(c => (
                <div key={c.key} className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <b>{c.product.name}</b>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{c.variation}{c.modifiers.length ? ` · ${c.modifiers.join(', ')}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="btn btn-ghost !px-2 !py-1" onClick={() => setCart(prev => prev.map(x => x.key === c.key ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                    <span className="w-5 text-center font-bold">{c.qty}</span>
                    <button className="btn btn-ghost !px-2 !py-1" onClick={() => setCart(prev => prev.map(x => x.key === c.key ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                  </div>
                  <b className="w-20 text-right">{fmt((c.product.price + c.delta + c.modTotal) * c.qty, cur)}</b>
                  <button className="font-bold" style={{ color: 'var(--red)' }} onClick={() => setCart(prev => prev.filter(x => x.key !== c.key))}>✕</button>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 text-sm border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between"><span>Subtotal</span><span>{fmt(cartTotals.subtotal, cur)}</span></div>
              <div className="flex justify-between"><span>Tax ({db.settings.taxRate}%)</span><span>{fmt(cartTotals.tax, cur)}</span></div>
              <div className="flex justify-between"><span>Service ({db.settings.serviceRate}%)</span><span>{fmt(cartTotals.serviceCharge, cur)}</span></div>
              <div className="flex justify-between font-extrabold"><span>Total</span><span>{fmt(cartTotals.total, cur)}</span></div>
            </div>
            <div className="mt-3"><div className="label">Your name (optional)</div>
              <input className="input" value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="e.g. Ahmed" />
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-3 z-40" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{cart.length === 0 ? 'Tap a dish to add it' : `${cart.reduce((s, c) => s + c.qty, 0)} item(s)`}{openOrder ? ' · adds to your open bill' : ''}</div>
            <b className="text-lg" style={{ color: 'var(--accent)' }}>{fmt(cartTotals.total, cur)}</b>
          </div>
          <button className="btn btn-primary !px-6 !py-3" disabled={cart.length === 0} onClick={placeOrder}>
            {openOrder ? 'Add to my order' : 'Place order'}
          </button>
        </div>
      </div>

      {customize && (
        <Modal title={`Customize — ${customize.name}`} onClose={() => setCustomize(null)}>
          <FoodImg src={customize.image} alt={customize.name} className="w-full h-40 object-cover rounded-xl mb-3" />
          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{customize.description}</p>
          {customize.variations.length > 0 && (
            <div className="mb-3"><div className="label mb-1">Size / portion</div>
              <div className="flex gap-2 flex-wrap">{customize.variations.map(v => (
                <button key={v.id} className={`btn ${varSel === v.name ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setVarSel(v.name)}>{v.name} {v.delta !== 0 ? `(${v.delta > 0 ? '+' : ''}${fmt(v.delta, cur)})` : ''}</button>
              ))}</div>
            </div>
          )}
          <div className="mb-3"><div className="label mb-1">Add-ons & spice</div>
            <div className="flex gap-2 flex-wrap">{db.modifiers.map(mo => (
              <button key={mo.id} className={`btn ${modSel.includes(mo.name) ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setModSel(prev => prev.includes(mo.name) ? prev.filter(x => x !== mo.name) : [...prev, mo.name])}>
                {mo.name}{mo.price > 0 ? ` +${fmt(mo.price, cur)}` : ''}
              </button>
            ))}</div>
          </div>
          <div className="mb-4"><div className="label mb-1">Special instructions</div>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. less spicy, no onion…" />
          </div>
          <button className="btn btn-primary w-full !py-3" onClick={() => {
            const v = customize.variations.find(x => x.name === varSel)
            const modTotal = modSel.reduce((s, n) => s + (db.modifiers.find(m => m.name === n)?.price || 0), 0)
            pushLine(customize, varSel, v?.delta || 0, modSel, modTotal, notes)
          }}>Add to order — {fmt(customize.price + (customize.variations.find(x => x.name === varSel)?.delta || 0) + modSel.reduce((s, n) => s + (db.modifiers.find(m => m.name === n)?.price || 0), 0), cur)}</button>
        </Modal>
      )}
    </div>
  )
}
