import { useMemo, useState } from 'react'
import { calcTotals, deductStock, fmt, nextOrderNumber, useStore } from '../store'
import { FoodImg, Modal, SearchInput } from '../components'
import type { OrderItem } from '../types'

export default function Storefront() {
  const { db, update } = useStore()
  const [cat, setCat] = useState<number | null>(null)
  const [q, setQ] = useState('')
  const [cart, setCart] = useState<{ productId: number; qty: number }[]>([])
  const [checkout, setCheckout] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState<string | null>(null)
  const cur = db.settings.currency

  const products = useMemo(() => db.products.filter(p =>
    (cat === null || p.categoryId === cat) && p.name.toLowerCase().includes(q.toLowerCase())), [db.products, cat, q])
  const featured = db.products.filter(p => p.featured)
  const items: OrderItem[] = cart.map(c => {
    const p = db.products.find(x => x.id === c.productId)!
    return { productId: p.id, name: p.name, qty: c.qty, unitPrice: p.price, variation: '', modifiers: '', notes: '' }
  })
  const totals = calcTotals(items, 0, db.settings.taxRate, mode === 'delivery' ? db.settings.deliveryFee : 0, 0)

  function placeOrder() {
    if (cart.length === 0 || !name.trim() || !phone.trim()) return
    const number = nextOrderNumber(db)
    update(d => {
      let next = deductStock(d, items)
      next = {
        ...next,
        orders: [{
          id: Date.now(), number, type: 'online', status: 'pending', kitchenStatus: 'new',
          customerId: null, customerName: name, waiterName: 'Online', tableLabel: null,
          items, subtotal: totals.subtotal, discount: 0, tax: totals.tax, serviceCharge: 0,
          deliveryFee: mode === 'delivery' ? d.settings.deliveryFee : 0, total: totals.total,
          paidAmount: 0, paymentStatus: 'unpaid', payments: [],
          createdAt: new Date().toISOString(), notes: `${mode === 'delivery' ? `Deliver to ${address}` : 'Pickup'} · ${phone}${notes ? ` · ${notes}` : ''}`,
          cancelReason: '', source: 'online',
        }, ...next.orders],
        notifications: [{ id: Date.now(), text: `New online order ${number} from ${name} — ${fmt(totals.total, cur)}`, kind: 'order', read: false, at: new Date().toISOString() }, ...next.notifications].slice(0, 50),
      }
      return next
    }, `Online order ${number} from ${name}`)
    setCart([]); setCheckout(false); setDone(number)
  }

  const myOrder = done ? db.orders.find(o => o.number === done) : undefined

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl anim-fade-up" style={{ minHeight: 260 }}>
        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1600&q=80" alt="BBQ" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.35))' }} />
        <div className="relative p-8 text-white max-w-xl">
          <div className="chip mb-3" style={{ background: '#fb923c', color: '#fff' }}>🔥 {db.settings.tagline}</div>
          <h1 className="text-4xl font-extrabold leading-tight">{db.settings.name}</h1>
          <p className="mt-2 text-white/85">Lahore's home for charcoal BBQ, desi classics, wok-fired Chinese and wood-fired pizza — all under one roof.</p>
          <p className="mt-3 text-sm text-white/75">{db.settings.address} · {db.settings.phone} · {db.settings.hours}</p>
          <button className="btn btn-primary mt-4 !px-6 !py-3" onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}>Order now ↓</button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold mb-3">Popular categories</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {db.categories.slice(0, 6).map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' }) }} className="card card-hover overflow-hidden text-left anim-fade-up">
              <FoodImg src={c.image} alt={c.name} className="w-full h-20 object-cover" />
              <div className="p-2 text-sm font-bold">{c.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-extrabold mb-3">Best sellers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featured.map(p => (
            <div key={p.id} className="card card-hover overflow-hidden anim-fade-up">
              <FoodImg src={p.image} alt={p.name} className="w-full h-32 object-cover" />
              <div className="p-3">
                <b className="text-sm">{p.name}</b>
                <div className="flex justify-between items-center mt-2">
                  <b style={{ color: 'var(--accent)' }}>{fmt(p.price, cur)}</b>
                  <button className="btn btn-primary !py-1 !px-3" disabled={!p.available} onClick={() => setCart(prev => {
                    const ex = prev.find(c => c.productId === p.id)
                    return ex ? prev.map(c => c.productId === p.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { productId: p.id, qty: 1 }]
                  })}>+ Add</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="menu">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
          <h2 className="text-xl font-extrabold">Full menu</h2>
          <div className="w-64"><SearchInput value={q} onChange={setQ} placeholder="Search dishes…" /></div>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <button className={`btn ${cat === null ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(null)}>All</button>
          {db.categories.map(c => <button key={c.id} className={`btn ${cat === c.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c.id)}>{c.name}</button>)}
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {products.map(p => (
            <div key={p.id} className="card card-hover p-3 flex gap-3 anim-fade-up">
              <FoodImg src={p.image} alt={p.name} className="w-24 h-24 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <b className="text-sm">{p.name}</b>
                <div className="text-xs line-clamp-2" style={{ color: 'var(--muted)' }}>{p.description}</div>
                <div className="flex justify-between items-center mt-2">
                  <b style={{ color: 'var(--accent)' }}>{fmt(p.price, cur)}</b>
                  <button className="btn btn-primary !py-1 !px-3" disabled={!p.available} onClick={() => setCart(prev => {
                    const ex = prev.find(c => c.productId === p.id)
                    return ex ? prev.map(c => c.productId === p.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { productId: p.id, qty: 1 }]
                  })}>+ Add</button>
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>{p.prepMins} min · {p.station}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {cart.length > 0 && (
        <div className="card p-4 lg:sticky lg:bottom-4 anim-pop">
          <h3 className="font-bold mb-2">Your cart ({cart.reduce((s, c) => s + c.qty, 0)} items)</h3>
          {cart.map(c => {
            const p = db.products.find(x => x.id === c.productId)!
            return (
              <div key={c.productId} className="flex items-center gap-2 text-sm py-1">
                <span className="flex-1">{p.name}</span>
                <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => setCart(prev => prev.map(x => x.productId === c.productId ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}>−</button>
                <b>{c.qty}</b>
                <button className="btn btn-ghost !px-2 !py-0.5" onClick={() => setCart(prev => prev.map(x => x.productId === c.productId ? { ...x, qty: x.qty + 1 } : x))}>+</button>
                <b className="w-20 text-right">{fmt(p.price * c.qty, cur)}</b>
                <button className="text-red-500" onClick={() => setCart(prev => prev.filter(x => x.productId !== c.productId))}>✕</button>
              </div>
            )
          })}
          <div className="flex justify-between font-extrabold mt-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <span>Total (incl. {db.settings.taxRate}% tax{mode === 'delivery' ? ` + ${fmt(db.settings.deliveryFee, cur)} delivery` : ''})</span>
            <span>{fmt(totals.total, cur)}</span>
          </div>
          <button className="btn btn-primary w-full mt-3 !py-3" onClick={() => setCheckout(true)}>Checkout →</button>
        </div>
      )}

      <div className="card p-5">
        <h3 className="font-bold mb-2">What customers say</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <p>“The BBQ platter is the best in Gulberg right now. Charcoal flavour is real.” — Hassan Javed ★★★★★</p>
          <p>“Biryani tastes like home. Quick service even on a Friday night.” — Mahnoor Fatima ★★★★★</p>
          <p>“Great zinger and the mint margarita is a must.” — Danish Ali ★★★★☆</p>
        </div>
      </div>

      {checkout && (
        <Modal title="Checkout" onClose={() => setCheckout(false)}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className={`btn flex-1 ${mode === 'delivery' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('delivery')}>🚚 Delivery</button>
              <button className={`btn flex-1 ${mode === 'pickup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('pickup')}>🛍 Pickup</button>
            </div>
            <div><div className="label">Your name</div><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><div className="label">Phone</div><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="03xx-xxxxxxx" /></div>
            {mode === 'delivery' && <div><div className="label">Delivery address</div><textarea className="input" value={address} onChange={e => setAddress(e.target.value)} /></div>}
            <div><div className="label">Order notes</div><input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything we should know?" /></div>
            <div className="flex justify-between font-extrabold"><span>Total to pay</span><span>{fmt(totals.total, cur)}</span></div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Pay on {mode === 'delivery' ? 'delivery' : 'pickup'} — Cash / Card accepted. Your order appears instantly in the POS and Kitchen Display.</p>
            <button className="btn btn-primary w-full !py-3" disabled={!name.trim() || !phone.trim() || (mode === 'delivery' && !address.trim())} onClick={placeOrder}>Confirm order — {fmt(totals.total, cur)}</button>
          </div>
        </Modal>
      )}

      {done && myOrder && (
        <Modal title="Order confirmed 🎉" onClose={() => setDone(null)}>
          <p className="text-sm mb-2">Thank you, {myOrder.customerName}! Your order <b>{myOrder.number}</b> is in the kitchen.</p>
          <div className="flex items-center gap-2 text-sm mb-3">
            <span>Kitchen status:</span>
            <span className="chip" style={{ background: '#b91c1c1e', color: 'var(--red)' }}>{myOrder.kitchenStatus}</span>
            <span style={{ color: 'var(--muted)' }}>· Total {fmt(myOrder.total, cur)}</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Track it here — refresh the page and the status updates as the kitchen advances it (KDS → accepted → preparing → ready → served).</p>
          <button className="btn btn-primary w-full mt-3" onClick={() => setDone(null)}>Done</button>
        </Modal>
      )}
    </div>
  )
}
