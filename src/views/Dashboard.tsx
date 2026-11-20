import { useMemo, useState } from 'react'
import { fmt, useStore } from '../store'
import { BarChart, Stat } from '../components'

function inRange(iso: string, from: string, to: string) {
  return iso.slice(0, 10) >= from && iso.slice(0, 10) <= to
}

export default function Dashboard() {
  const { db } = useStore()
  const [preset, setPreset] = useState<'today' | '7' | '30' | 'custom'>('7')
  const [from, setFrom] = useState('2026-11-13')
  const [to, setTo] = useState('2026-11-19')

  const range = useMemo(() => {
    if (preset === 'today') return { from: '2026-11-19', to: '2026-11-19' }
    if (preset === '7') return { from: '2026-11-13', to: '2026-11-19' }
    if (preset === '30') return { from: '2026-10-21', to: '2026-11-19' }
    return { from, to }
  }, [preset, from, to])

  const m = useMemo(() => {
    const orders = db.orders.filter(o => inRange(o.createdAt, range.from, range.to))
    const completed = orders.filter(o => o.status === 'completed')
    const cancelled = orders.filter(o => o.status === 'cancelled')
    const sales = completed.reduce((s, o) => s + o.total, 0)
    const cogs = completed.reduce((s, o) => s + o.items.reduce((a, it) => {
      const p = db.products.find(x => x.id === it.productId)
      return a + (p ? p.costPrice * it.qty : 0)
    }, 0), 0)
    const topItems = new Map<string, { qty: number; revenue: number }>()
    const catSales = new Map<string, number>()
    const pay = new Map<string, number>()
    const waiter = new Map<string, { orders: number; sales: number; cancelled: number }>()
    for (const o of completed) {
      for (const it of o.items) {
        const t = topItems.get(it.name) || { qty: 0, revenue: 0 }
        t.qty += it.qty; t.revenue += it.unitPrice * it.qty; topItems.set(it.name, t)
        const p = db.products.find(x => x.id === it.productId)
        if (p) {
          const c = db.categories.find(x => x.id === p.categoryId)
          if (c) catSales.set(c.name, (catSales.get(c.name) || 0) + it.unitPrice * it.qty)
        }
      }
      for (const payRow of o.payments) pay.set(payRow.method, (pay.get(payRow.method) || 0) + payRow.amount)
      const w = waiter.get(o.waiterName) || { orders: 0, sales: 0, cancelled: 0 }
      w.orders++; w.sales += o.total; waiter.set(o.waiterName, w)
    }
    for (const o of cancelled) {
      const w = waiter.get(o.waiterName) || { orders: 0, sales: 0, cancelled: 0 }
      w.cancelled++; waiter.set(o.waiterName, w)
    }
    const days: { label: string; value: number }[] = []
    const d0 = new Date(range.from + 'T00:00:00'), d1 = new Date(range.to + 'T00:00:00')
    for (let d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      days.push({ label: key.slice(5), value: completed.filter(o => o.createdAt.slice(0, 10) === key).reduce((s, o) => s + o.total, 0) })
    }
    const lowStock = db.ingredients.filter(i => i.qty <= i.minLevel)
    const activeTables = db.tables.filter(t => t.status !== 'available' && t.status !== 'cleaning').length
    return {
      orders, completed, cancelled, sales, cogs,
      aov: completed.length ? sales / completed.length : 0,
      topItems: [...topItems.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 6),
      catSales: [...catSales.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
      pay: [...pay.entries()], waiter: [...waiter.entries()],
      days, lowStock, activeTables,
      inventoryValue: db.ingredients.reduce((s, i) => s + i.qty * i.unitCost, 0),
    }
  }, [db, range])

  const cur = db.settings.currency
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Owner Dashboard</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{range.from} → {range.to} · all figures from real orders in this build</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {(['today', '7', '30', 'custom'] as const).map(p => (
            <button key={p} className={`btn ${preset === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPreset(p)}>
              {p === 'today' ? 'Today' : p === '7' ? 'Last 7 days' : p === '30' ? 'Last 30 days' : 'Custom'}
            </button>
          ))}
          {preset === 'custom' && (
            <>
              <input type="date" className="input !w-auto" value={from} onChange={e => setFrom(e.target.value)} />
              <input type="date" className="input !w-auto" value={to} onChange={e => setTo(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total sales" value={fmt(m.sales, cur)} sub={`${m.completed.length} completed orders`} accent />
        <Stat label="Total orders" value={String(m.orders.length)} sub={`${m.cancelled.length} cancelled · ${m.orders.filter(o => o.status === 'pending').length} pending`} />
        <Stat label="Average order value" value={fmt(m.aov, cur)} sub="Completed orders only" />
        <Stat label="Est. gross profit" value={fmt(m.sales - m.cogs, cur)} sub={`COGS ${fmt(m.cogs, cur)}`} />
        <Stat label="Active tables" value={`${m.activeTables} / ${db.tables.length}`} sub={`Occupancy ${Math.round((m.activeTables / db.tables.length) * 100)}%`} />
        <Stat label="Customers" value={String(db.customers.length)} sub="In CRM" />
        <Stat label="Inventory value" value={fmt(m.inventoryValue, cur)} sub={`${m.lowStock.length} low-stock items`} />
        <Stat label="Tax collected" value={fmt(m.completed.reduce((s, o) => s + o.tax, 0), cur)} sub={`${db.settings.taxRate}% GST`} />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 md:col-span-2">
          <h3 className="font-bold mb-1">Daily sales</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Hover a bar for the exact figure</p>
          <BarChart data={m.days} />
        </div>
        <div className="card p-5">
          <h3 className="font-bold mb-3">Sales by payment method</h3>
          {m.pay.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No payments in this range.</p>}
          {m.pay.map(([name, v]) => (
            <div key={name} className="mb-3">
              <div className="flex justify-between text-sm"><span>{name}</span><b>{fmt(v, cur)}</b></div>
              <div className="h-2 rounded-full mt-1" style={{ background: 'var(--surface2)' }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(v / Math.max(1, m.sales)) * 100}%`, background: 'var(--accent)' }} />
              </div>
            </div>
          ))}
          <h3 className="font-bold mt-5 mb-3">Low stock alerts</h3>
          {m.lowStock.length === 0 ? <p className="text-sm" style={{ color: 'var(--muted)' }}>All stock levels OK.</p> : m.lowStock.map(i => (
            <div key={i.id} className="text-sm flex justify-between py-1 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <span>⚠ {i.name}</span><b style={{ color: 'var(--red)' }}>{i.qty} {i.unit} (min {i.minLevel})</b>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-3">Top-selling items</h3>
          {m.topItems.map(([name, t], i) => (
            <div key={name} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <span>{i + 1}. {name} <span style={{ color: 'var(--muted)' }}>×{t.qty}</span></span><b>{fmt(t.revenue, cur)}</b>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h3 className="font-bold mb-3">Best categories</h3>
          {m.catSales.map(([name, v]) => (
            <div key={name} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <span>{name}</span><b>{fmt(v, cur)}</b>
            </div>
          ))}
        </div>
        <div className="card p-5">
          <h3 className="font-bold mb-3">Waiter performance</h3>
          {m.waiter.map(([name, w]) => (
            <div key={name} className="text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between"><b>{name}</b><b>{fmt(w.sales, cur)}</b></div>
              <div style={{ color: 'var(--muted)' }}>{w.orders} orders · AOV {fmt(w.orders ? w.sales / w.orders : 0, cur)} · {w.cancelled} cancelled</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
