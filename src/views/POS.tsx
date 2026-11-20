import { useMemo, useState } from 'react'
import { calcTotals, deductStock, fmt, nextOrderNumber, useStore } from '../store'
import { FoodImg, Modal, SearchInput, StatusChip } from '../components'
import type { OrderItem, OrderType, Product } from '../types'

interface CartLine { key: string; product: Product; variation: string; delta: number; modifiers: string[]; modTotal: number; qty: number; notes: string }

const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: 'dine_in', label: 'Dine-in' }, { id: 'takeaway', label: 'Takeaway' },
  { id: 'delivery', label: 'Delivery' }, { id: 'pickup', label: 'Pickup' }, { id: 'online', label: 'Online' },
]
const PAY_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Digital Wallet']

export default function POS() {
  const { db, user, update } = useStore()
  const [cat, setCat] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [tableLabel, setTableLabel] = useState('')
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [discountPct, setDiscountPct] = useState(0)
  const [customize, setCustomize] = useState<Product | null>(null)
  const [varSel, setVarSel] = useState('')
  const [modSel, setModSel] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [payMethod, setPayMethod] = useState('Cash')
  const [split, setSplit] = useState(false)
  const [split2, setSplit2] = useState('Card')
  const [invoice, setInvoice] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const cur = db.settings.currency
  const products = useMemo(() => db.products.filter(p =>
    (cat === null || p.categoryId === cat) &&
    (q === '' || p.name.toLowerCase().includes(q.toLowerCase()))), [db.products, cat, q])

  const items: OrderItem[] = cart.map(c => ({
    productId: c.product.id, name: c.product.name, qty: c.qty,
    unitPrice: c.product.price + c.delta + c.modTotal, variation: c.variation,
    modifiers: c.modifiers.join(', '), notes: c.notes,
  }))
  const totals = calcTotals(items, discountPct, db.settings.taxRate,
    orderType === 'delivery' ? db.settings.deliveryFee : 0,
    orderType === 'dine_in' ? db.settings.serviceRate : 0)

  function addToCart(p: Product) {
    if (p.variations.length || db.modifiers.length) { setCustomize(p); setVarSel(p.variations[0]?.name || ''); setModSel([]); setNotes(''); return }
    pushLine(p, '', 0, [], 0, '')
  }
  function pushLine(p: Product, variation: string, delta: number, mods: string[], modTotal: number, note: string) {
    const key = `${p.id}|${variation}|${mods.join('+')}|${note}`
    setCart(prev => {
      const ex = prev.find(c => c.key === key)
      if (ex) return prev.map(c => c.key === key ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { key, product: p, variation, delta, modifiers: mods, modTotal, qty: 1, notes: note }]
    })
    setCustomize(null)
  }

  function placeOrder(paid: boolean, method: string, method2?: string) {
    if (cart.length === 0) return
    const cust = db.customers.find(c => c.id === customerId)
    const number = nextOrderNumber(db)
    const order = {
      id: Date.now(), number, type: orderType,
      status: paid ? 'completed' as const : 'pending' as const,
      kitchenStatus: 'new' as const,
      customerId: customerId === '' ? null : customerId,
      customerName: cust?.name || 'Walk-in',
      waiterName: user?.name || 'POS',
      tableLabel: orderType === 'dine_in' ? (tableLabel || null) : null,
      items, subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax,
      serviceCharge: totals.serviceCharge, deliveryFee: orderType === 'delivery' ? db.settings.deliveryFee : 0,
      total: totals.total,
      paidAmount: paid ? totals.total : 0,
      paymentStatus: paid ? 'paid' as const : 'unpaid' as const,
      payments: paid ? [{ method, amount: split && method2 ? Math.round(totals.total / 2) : totals.total, at: new Date().toISOString() },
        ...(split && method2 ? [{ method: method2, amount: totals.total - Math.round(totals.total / 2), at: new Date().toISOString() }] : [])] : [],
      createdAt: new Date().toISOString(), notes: '', cancelReason: '',
      source: orderType === 'online' ? 'online' as const : 'pos' as const,
    }
    update(d => {
      let next = deductStock(d, items)
      next = { ...next, orders: [order, ...next.orders] }
      if (orderType === 'dine_in' && tableLabel) {
        next = { ...next, tables: next.tables.map(t => t.label === tableLabel ? { ...t, status: 'occupied' as const } : t) }
      }
      if (cust && paid) {
        const pts = Math.floor(totals.total / 1000) * db.settings.loyaltyPer1000
        next = { ...next, customers: next.customers.map(c => c.id === cust.id ? { ...c, points: c.points + pts } : c) }
      }
      next = { ...next, notifications: [{ id: Date.now(), text: `New order ${number} — ${fmt(totals.total, cur)} (${orderType.replace('_', ' ')})`, kind: 'order', read: false, at: new Date().toISOString() }, ...next.notifications].slice(0, 50) }
      return next
    }, `Order ${number} created (${fmt(totals.total, cur)})`)
    setCart([]); setDiscountPct(0); setPayOpen(false); setInvoice(number)
    setToast(`Order ${number} placed`)
    setTimeout(() => setToast(''), 3500)
  }

  function holdOrder() {
    if (cart.length === 0) return
    const number = nextOrderNumber(db)
    update(d => ({ ...d, orders: [{ id: Date.now(), number, type: orderType, status: 'held', kitchenStatus: 'new', customerId: customerId === '' ? null : customerId, customerName: db.customers.find(c => c.id === customerId)?.name || 'Walk-in', waiterName: user?.name || 'POS', tableLabel: null, items, subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax, serviceCharge: totals.serviceCharge, deliveryFee: 0, total: totals.total, paidAmount: 0, paymentStatus: 'unpaid', payments: [], createdAt: new Date().toISOString(), notes: '', cancelReason: '', source: 'pos' }, ...d.orders] }), `Order ${number} held`)
    setCart([]); setToast(`Order ${number} held — resume it from Held Orders`)
    setTimeout(() => setToast(''), 3500)
  }

  const held = db.orders.filter(o => o.status === 'held')
  const lastOrder = invoice ? db.orders.find(o => o.number === invoice) : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Point of Sale</h1>
        <div className="flex gap-2 flex-wrap">
          {ORDER_TYPES.map(t => (
            <button key={t.id} className={`btn ${orderType === t.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setOrderType(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>
      {toast && <div className="card p-3 text-sm font-semibold anim-pop" style={{ borderColor: 'var(--green)', color: 'var(--green)' }}>✓ {toast}</div>}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px]"><SearchInput value={q} onChange={setQ} placeholder="Search food items…" /></div>
            <button className={`btn ${cat === null ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(null)}>All</button>
            {db.categories.map(c => (
              <button key={c.id} className={`btn ${cat === c.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c.id)}>{c.name}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} disabled={!p.available}
                className="card card-hover text-left overflow-hidden anim-fade-up disabled:opacity-50">
                <FoodImg src={p.image} alt={p.name} className="w-full h-28 object-cover" />
                <div className="p-3">
                  <div className="font-bold text-sm leading-tight">{p.name}</div>
                  <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{p.description}</div>
                  <div className="flex justify-between items-center mt-2">
                    <b style={{ color: 'var(--accent)' }}>{fmt(p.price, cur)}</b>
                    {p.available ? <span className="chip" style={{ background: '#15803d1e', color: 'var(--green)' }}>Available</span> : <span className="chip" style={{ background: '#b91c1c1e', color: 'var(--red)' }}>86'd</span>}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>{p.station} · {p.prepMins} min{p.variations.length ? ` · ${p.variations.map(v => v.name).join('/')}` : ''}</div>
                </div>
              </button>
            ))}
            {products.length === 0 && <div className="col-span-full"><p className="text-sm" style={{ color: 'var(--muted)' }}>No items match your search.</p></div>}
          </div>
          {held.length > 0 && (
            <div className="card p-4">
              <h3 className="font-bold mb-2">Held orders</h3>
              {held.map(o => (
                <div key={o.id} className="flex justify-between items-center py-1.5 text-sm border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <span>{o.number} · {o.items.length} items · <b>{fmt(o.total, cur)}</b></span>
                  <button className="btn btn-ghost !py-1" onClick={() => {
                    setCart(o.items.map(it => {
                      const p = db.products.find(x => x.id === it.productId)!
                      return { key: `${it.productId}|${it.variation}`, product: p, variation: it.variation, delta: 0, modifiers: it.modifiers ? [it.modifiers] : [], modTotal: 0, qty: it.qty, notes: it.notes }
                    }))
                    update(d => ({ ...d, orders: d.orders.filter(x => x.id !== o.id) }), `Held order ${o.number} resumed`)
                  }}>Resume</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4 lg:sticky lg:top-4 anim-fade-up">
          <h3 className="font-bold mb-3">Current order</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select className="input" value={tableLabel} onChange={e => setTableLabel(e.target.value)} disabled={orderType !== 'dine_in'}>
              <option value="">Table (optional)</option>
              {db.tables.filter(t => t.status === 'available' || t.status === 'occupied').map(t => <option key={t.id} value={t.label}>{t.label} · {t.capacity} seats</option>)}
            </select>
            <select className="input" value={customerId} onChange={e => setCustomerId(e.target.value === '' ? '' : Number(e.target.value))}>
              <option value="">Walk-in customer</option>
              {db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {cart.length === 0 && <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>Tap a food card to add it here.</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
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
                <button className="text-red-500 font-bold" onClick={() => setCart(prev => prev.filter(x => x.key !== c.key))}>✕</button>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1.5 text-sm border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(totals.subtotal, cur)}</span></div>
            <div className="flex justify-between items-center"><span>Discount %</span>
              <input type="number" min={0} max={50} className="input !w-20 !py-1 text-right" value={discountPct} onChange={e => setDiscountPct(Math.max(0, Math.min(50, Number(e.target.value) || 0)))} />
            </div>
            {totals.discount > 0 && <div className="flex justify-between" style={{ color: 'var(--green)' }}><span>Discount</span><span>−{fmt(totals.discount, cur)}</span></div>}
            <div className="flex justify-between"><span>Tax ({db.settings.taxRate}%)</span><span>{fmt(totals.tax, cur)}</span></div>
            {totals.serviceCharge > 0 && <div className="flex justify-between"><span>Service ({db.settings.serviceRate}%)</span><span>{fmt(totals.serviceCharge, cur)}</span></div>}
            {orderType === 'delivery' && <div className="flex justify-between"><span>Delivery fee</span><span>{fmt(db.settings.deliveryFee, cur)}</span></div>}
            <div className="flex justify-between text-lg font-extrabold pt-1 border-t" style={{ borderColor: 'var(--border)' }}><span>Total</span><span style={{ color: 'var(--accent)' }}>{fmt(totals.total, cur)}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button className="btn btn-ghost" disabled={cart.length === 0} onClick={holdOrder}>⏸ Hold</button>
            <button className="btn btn-ghost" disabled={cart.length === 0} onClick={() => { setCart([]); setDiscountPct(0) }}>Clear</button>
            <button className="btn btn-primary col-span-2 !py-3" disabled={cart.length === 0} onClick={() => setPayOpen(true)}>Charge {fmt(totals.total, cur)}</button>
          </div>
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

      {payOpen && (
        <Modal title="Payment" onClose={() => setPayOpen(false)}>
          <div className="text-3xl font-extrabold mb-4" style={{ color: 'var(--accent)' }}>{fmt(totals.total, cur)}</div>
          <div className="label mb-1">Payment method</div>
          <div className="flex gap-2 flex-wrap mb-3">{PAY_METHODS.map(m => (
            <button key={m} className={`btn ${payMethod === m ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPayMethod(m)}>{m}</button>
          ))}</div>
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={split} onChange={e => setSplit(e.target.checked)} /> Split payment (50 / 50)
          </label>
          {split && (
            <div className="mb-4"><div className="label mb-1">Second method</div>
              <div className="flex gap-2 flex-wrap">{PAY_METHODS.filter(m => m !== payMethod).map(m => (
                <button key={m} className={`btn ${split2 === m ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setSplit2(m)}>{m}</button>
              ))}</div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" onClick={() => { setPayOpen(false); placeOrder(false, payMethod) }}>Save unpaid</button>
            <button className="btn btn-primary" onClick={() => placeOrder(true, payMethod, split ? split2 : undefined)}>Confirm payment</button>
          </div>
        </Modal>
      )}

      {invoice && lastOrder && (
        <Modal title={`Invoice ${lastOrder.number}`} onClose={() => setInvoice(null)}>
          <div className="text-center mb-4">
            <b className="text-lg">{db.settings.name}</b>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{db.settings.address} · {db.settings.phone}</div>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>Customer</span><b>{lastOrder.customerName}</b></div>
            <div className="flex justify-between"><span>Type</span><b>{lastOrder.type.replace('_', ' ')}</b></div>
            <div className="flex justify-between"><span>Waiter</span><b>{lastOrder.waiterName}</b></div>
            <div className="flex justify-between"><span>Status</span><StatusChip status={lastOrder.paymentStatus} /></div>
          </div>
          <div className="border-t my-3 pt-3 space-y-1 text-sm" style={{ borderColor: 'var(--border)' }}>
            {lastOrder.items.map((it, i) => (
              <div key={i} className="flex justify-between"><span>{it.qty} × {it.name} {it.variation && `(${it.variation})`}</span><span>{fmt(it.unitPrice * it.qty, cur)}</span></div>
            ))}
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}><span>Tax</span><span>{fmt(lastOrder.tax, cur)}</span></div>
            <div className="flex justify-between font-extrabold text-base"><span>Total</span><span>{fmt(lastOrder.total, cur)}</span></div>
          </div>
          <button className="btn btn-primary w-full" onClick={() => window.print()}>🖨 Print receipt</button>
        </Modal>
      )}
    </div>
  )
}
