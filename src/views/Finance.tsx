import { useMemo, useState } from 'react'
import { fmt, timeAgo, useStore } from '../store'
import { Empty, Modal, Stat } from '../components'

export function ExpensesView() {
  const { db, update } = useStore()
  const [form, setForm] = useState(false)
  const [category, setCategory] = useState('Rent')
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState('Cash')
  const cur = db.settings.currency
  const total = db.expenses.reduce((s, e) => s + e.amount, 0)
  const byCat = useMemo(() => {
    const m = new Map<string, number>()
    db.expenses.forEach(e => m.set(e.category, (m.get(e.category) || 0) + e.amount))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [db.expenses])
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Expenses</h1>
        <button className="btn btn-primary" onClick={() => setForm(true)}>+ Record expense</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total expenses" value={fmt(total, cur)} sub={`${db.expenses.length} records`} accent />
        {byCat.slice(0, 3).map(([c, v]) => <Stat key={c} label={c} value={fmt(v, cur)} />)}
      </div>
      <div className="card p-4">
        {db.expenses.map(e => (
          <div key={e.id} className="flex flex-wrap justify-between gap-2 text-sm py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <span><b>{e.category}</b> · {e.description} · {e.date} · {e.method}</span>
            <span className="flex gap-2 items-center"><b>{fmt(e.amount, cur)}</b>
              <button className="btn btn-ghost !py-1" style={{ color: 'var(--red)' }} onClick={() => update(d => ({ ...d, expenses: d.expenses.filter(x => x.id !== e.id) }), `Expense ${e.description} deleted`)}>Delete</button>
            </span>
          </div>
        ))}
      </div>
      {form && (
        <Modal title="Record expense" onClose={() => setForm(false)}>
          <div className="space-y-3">
            <div><div className="label">Category</div><select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {['Rent', 'Electricity', 'Gas', 'Water', 'Salaries', 'Maintenance', 'Marketing', 'Utilities', 'Miscellaneous'].map(c => <option key={c}>{c}</option>)}
            </select></div>
            <div><div className="label">Description</div><input className="input" value={desc} onChange={e => setDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="label">Amount ({cur})</div><input type="number" className="input" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
              <div><div className="label">Method</div><select className="input" value={method} onChange={e => setMethod(e.target.value)}>{['Cash', 'Card', 'Bank Transfer', 'Digital Wallet'].map(m => <option key={m}>{m}</option>)}</select></div>
            </div>
            <button className="btn btn-primary w-full" disabled={!desc.trim() || amount <= 0} onClick={() => {
              update(d => ({ ...d, expenses: [{ id: Date.now(), category, description: desc, amount, method, date: new Date().toISOString().slice(0, 10) }, ...d.expenses] }), `Expense ${desc} ${fmt(amount, cur)} recorded`)
              setForm(false); setDesc(''); setAmount(0)
            }}>Save expense</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function ReportsView() {
  const { db } = useStore()
  const [from, setFrom] = useState('2026-11-13')
  const [to, setTo] = useState('2026-11-19')
  const cur = db.settings.currency
  const m = useMemo(() => {
    const orders = db.orders.filter(o => o.createdAt.slice(0, 10) >= from && o.createdAt.slice(0, 10) <= to)
    const completed = orders.filter(o => o.status === 'completed')
    const revenue = completed.reduce((s, o) => s + o.total, 0)
    const cogs = completed.reduce((s, o) => s + o.items.reduce((a, it) => {
      const p = db.products.find(x => x.id === it.productId)
      return a + (p ? p.costPrice * it.qty : 0)
    }, 0), 0)
    const expenses = db.expenses.filter(e => e.date >= from && e.date <= to).reduce((s, e) => s + e.amount, 0)
    const tax = completed.reduce((s, o) => s + o.tax, 0)
    const discounts = completed.reduce((s, o) => s + o.discount, 0)
    const refunds = orders.filter(o => o.paymentStatus === 'refunded').reduce((s, o) => s + o.total, 0)
    const cash = completed.reduce((s, o) => s + o.paidAmount, 0)
    const pay = new Map<string, number>()
    completed.forEach(o => o.payments.forEach(p => pay.set(p.method, (pay.get(p.method) || 0) + p.amount)))
    return { orders, completed, revenue, cogs, expenses, tax, discounts, refunds, cash, pay: [...pay.entries()], gross: revenue - cogs, net: revenue - cogs - expenses }
  }, [db, from, to])

  function exportCSV() {
    const rows = [['Date', 'Order', 'Customer', 'Type', 'Total', 'Tax', 'Payment status'].join(',')]
    m.completed.forEach(o => rows.push([o.createdAt.slice(0, 10), o.number, `"${o.customerName}"`, o.type, String(o.total), String(o.tax), o.paymentStatus].join(',')))
    rows.push('', `Revenue,${m.revenue}`, `COGS,${m.cogs}`, `Gross profit,${m.gross}`, `Expenses,${m.expenses}`, `Net profit,${m.net}`, `Tax collected,${m.tax}`, `Discounts,${m.discounts}`, `Refunds,${m.refunds}`)
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `urban-bites-report-${from}-to-${to}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Financial Reports</h1>
        <div className="flex gap-2 items-center">
          <input type="date" className="input !w-auto" value={from} onChange={e => setFrom(e.target.value)} />
          <input type="date" className="input !w-auto" value={to} onChange={e => setTo(e.target.value)} />
          <button className="btn btn-primary" onClick={exportCSV}>⬇ Export CSV</button>
        </div>
      </div>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>Revenue is completed orders only. Profit is estimated (cost prices from menu). Cash collected is what was actually paid.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Gross revenue" value={fmt(m.revenue, cur)} sub={`${m.completed.length} completed orders`} accent />
        <Stat label="COGS" value={fmt(m.cogs, cur)} />
        <Stat label="Est. gross profit" value={fmt(m.gross, cur)} />
        <Stat label="Expenses" value={fmt(m.expenses, cur)} />
        <Stat label="Est. net profit" value={fmt(m.net, cur)} sub={m.net < 0 ? 'Loss in this range' : 'Profit in this range'} />
        <Stat label="Cash collected" value={fmt(m.cash, cur)} />
        <Stat label="Tax collected" value={fmt(m.tax, cur)} />
        <Stat label="Discounts / refunds" value={`${fmt(m.discounts, cur)} / ${fmt(m.refunds, cur)}`} />
      </div>
      <div className="card p-5">
        <h3 className="font-bold mb-3">Payment breakdown</h3>
        {m.pay.length === 0 ? <p className="text-sm" style={{ color: 'var(--muted)' }}>No payments in this range.</p> : m.pay.map(([name, v]) => (
          <div key={name} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <span>{name}</span><b>{fmt(v, cur)} ({m.revenue ? Math.round((v / m.revenue) * 100) : 0}%)</b>
          </div>
        ))}
      </div>
    </div>
  )
}

export function NotificationsView() {
  const { db, update } = useStore()
  const unread = db.notifications.filter(n => !n.read).length
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Notifications {unread > 0 && <span className="chip" style={{ background: '#b91c1c1e', color: 'var(--red)' }}>{unread} unread</span>}</h1>
        <button className="btn btn-ghost" onClick={() => update(d => ({ ...d, notifications: d.notifications.map(n => ({ ...n, read: true })) }))}>Mark all read</button>
      </div>
      {db.notifications.length === 0 && <Empty text="No notifications." />}
      {db.notifications.map(n => (
        <div key={n.id} className="card p-4 flex justify-between gap-3 anim-fade-up" style={{ opacity: n.read ? 0.65 : 1 }}>
          <div><b className="text-sm">{n.text}</b><div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{n.kind} · {timeAgo(n.at)}</div></div>
          {!n.read && <button className="btn btn-ghost !py-1 self-start" onClick={() => update(d => ({ ...d, notifications: d.notifications.map(x => x.id === n.id ? { ...x, read: true } : x) }))}>Mark read</button>}
        </div>
      ))}
    </div>
  )
}

export function SettingsView() {
  const { db, update, resetDemo, theme, toggleTheme } = useStore()
  const [s, setS] = useState(db.settings)
  const cur = db.settings.currency
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-extrabold">Restaurant Settings</h1>
      <div className="card p-5 space-y-3">
        <div><div className="label">Restaurant name</div><input className="input" value={s.name} onChange={e => setS({ ...s, name: e.target.value })} /></div>
        <div><div className="label">Tagline</div><input className="input" value={s.tagline} onChange={e => setS({ ...s, tagline: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><div className="label">Phone</div><input className="input" value={s.phone} onChange={e => setS({ ...s, phone: e.target.value })} /></div>
          <div><div className="label">Email</div><input className="input" value={s.email} onChange={e => setS({ ...s, email: e.target.value })} /></div>
        </div>
        <div><div className="label">Address</div><input className="input" value={s.address} onChange={e => setS({ ...s, address: e.target.value })} /></div>
        <div><div className="label">Opening hours</div><input className="input" value={s.hours} onChange={e => setS({ ...s, hours: e.target.value })} /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div><div className="label">Currency</div><select className="input" value={s.currency} onChange={e => setS({ ...s, currency: e.target.value })}>{['PKR', 'USD', 'EUR', 'GBP', 'AED'].map(c => <option key={c}>{c}</option>)}</select></div>
          <div><div className="label">Tax %</div><input type="number" className="input" value={s.taxRate} onChange={e => setS({ ...s, taxRate: Number(e.target.value) })} /></div>
          <div><div className="label">Service %</div><input type="number" className="input" value={s.serviceRate} onChange={e => setS({ ...s, serviceRate: Number(e.target.value) })} /></div>
          <div><div className="label">Delivery fee</div><input type="number" className="input" value={s.deliveryFee} onChange={e => setS({ ...s, deliveryFee: Number(e.target.value) })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><div className="label">Loyalty points per 1000 {cur}</div><input type="number" className="input" value={s.loyaltyPer1000} onChange={e => setS({ ...s, loyaltyPer1000: Number(e.target.value) })} /></div>
          <div><div className="label">100 points value ({cur})</div><input type="number" className="input" value={s.loyaltyValue} onChange={e => setS({ ...s, loyaltyValue: Number(e.target.value) })} /></div>
        </div>
        <button className="btn btn-primary w-full" onClick={() => update(d => ({ ...d, settings: s }), 'Settings updated')}>Save settings</button>
      </div>
      <div className="card p-5">
        <h3 className="font-bold mb-2">Appearance</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Current theme: <b>{theme}</b> — also switchable from the header. Your choice is saved on this device.</p>
        <button className="btn btn-ghost" onClick={toggleTheme}>Switch to {theme === 'light' ? 'dark' : 'light'} theme</button>
      </div>
      <div className="card p-5">
        <h3 className="font-bold mb-2">Demo data</h3>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Reset everything back to the original seeded demo (34 dishes, 54 orders, staff, customers, suppliers).</p>
        <button className="btn btn-danger" onClick={() => { if (confirm('Reset all data to the seeded demo? Your changes will be lost.')) resetDemo() }}>Reset demo data</button>
      </div>
    </div>
  )
}

export function AuditView() {
  const { db } = useStore()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Audit Log</h1>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>Logins, order changes, refunds, cancellations and settings changes are recorded here.</p>
      {db.audit.length === 0 && <Empty text="No audit entries yet." />}
      {db.audit.map(a => (
        <div key={a.id} className="card p-3 flex justify-between gap-3 text-sm anim-fade-up">
          <span><b>{a.actor}</b> — {a.action}</span>
          <span style={{ color: 'var(--muted)' }}>{timeAgo(a.at)}</span>
        </div>
      ))}
    </div>
  )
}
