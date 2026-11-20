import { useMemo, useState } from 'react'
import { fmt, KITCHEN_FLOW, timeAgo, useStore } from '../store'
import { Empty, FoodImg, Modal, SearchInput, StatusChip } from '../components'
import type { KitchenStatus, Table } from '../types'

const TABLE_STATUS = ['available', 'occupied', 'reserved', 'waiting_food', 'served', 'payment_pending', 'cleaning'] as const

export function TablesView() {
  const { db, update } = useStore()
  const [floor, setFloor] = useState('Main Hall')
  const [sel, setSel] = useState<Table | null>(null)
  const tables = db.tables.filter(t => t.floor === floor)
  const color: Record<string, string> = {
    available: '#15803d', occupied: '#b91c1c', reserved: '#b45309', waiting_food: '#92400e',
    served: '#15803d', payment_pending: '#b45309', cleaning: '#6b7280',
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Tables & Floor Plan</h1>
        <div className="flex gap-2">
          {['Main Hall', 'Family Hall'].map(f => (
            <button key={f} className={`btn ${floor === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFloor(f)}>{f}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 flex-wrap text-xs">
        {TABLE_STATUS.map(s => <span key={s} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full inline-block" style={{ background: color[s] }} />{s.replace(/_/g, ' ')}</span>)}
      </div>
      <div className="card p-4 relative min-h-[320px] anim-fade-up" style={{ background: 'var(--surface2)' }}>
        {tables.map(t => (
          <button key={t.id} onClick={() => setSel(t)}
            className="absolute card card-hover p-3 text-center anim-pop"
            style={{ left: `${t.x}%`, top: `${t.y}%`, width: '20%', borderColor: color[t.status], borderWidth: 2 }}>
            <div className="font-extrabold text-lg">{t.label}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{t.capacity} seats</div>
            <StatusChip status={t.status} />
            <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
              {t.waiterId ? db.users.find(u => u.id === t.waiterId)?.name.split(' ')[0] : '—'}
            </div>
          </button>
        ))}
      </div>
      <div className="card p-4">
        <h3 className="font-bold mb-2">Reservations</h3>
        {db.reservations.map(r => (
          <div key={r.id} className="flex flex-wrap justify-between gap-2 text-sm py-1.5 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <span><b>{r.customer}</b> · {r.tableLabel} · {r.date} {r.time} · {r.guests} guests</span>
            <span className="flex gap-2 items-center"><StatusChip status={r.status.toLowerCase()} />
              <button className="btn btn-ghost !py-1" onClick={() => update(d => ({ ...d, reservations: d.reservations.map(x => x.id === r.id ? { ...x, status: 'Seated' } : x) }), `Reservation ${r.customer} seated`)}>Seat</button>
              <button className="btn btn-ghost !py-1" onClick={() => update(d => ({ ...d, reservations: d.reservations.map(x => x.id === r.id ? { ...x, status: 'Cancelled' } : x) }), `Reservation ${r.customer} cancelled`)}>Cancel</button>
            </span>
          </div>
        ))}
      </div>
      {sel && (
        <Modal title={`Table ${sel.label}`} onClose={() => setSel(null)}>
          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{sel.floor} · {sel.capacity} seats · Waiter: {sel.waiterId ? db.users.find(u => u.id === sel.waiterId)?.name : 'Unassigned'}</p>
          <div className="label mb-1">Change status</div>
          <div className="flex gap-2 flex-wrap mb-4">{TABLE_STATUS.map(s => (
            <button key={s} className={`btn ${sel.status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => {
              update(d => ({ ...d, tables: d.tables.map(t => t.id === sel.id ? { ...t, status: s } : t) }), `Table ${sel.label} → ${s}`)
              setSel({ ...sel, status: s })
            }}>{s.replace(/_/g, ' ')}</button>
          ))}</div>
          <h4 className="font-bold mb-2">Orders on this table</h4>
          {db.orders.filter(o => o.tableLabel === sel.label).slice(0, 5).map(o => (
            <div key={o.id} className="flex justify-between text-sm py-1 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <span>{o.number} · {o.status}</span><b>{fmt(o.total, db.settings.currency)}</b>
            </div>
          ))}
          {db.orders.filter(o => o.tableLabel === sel.label).length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No orders yet on this table.</p>}
        </Modal>
      )}
    </div>
  )
}

export function KDSView() {
  const { db, update } = useStore()
  const [station, setStation] = useState('All')
  const stations = ['All', 'Fast Food', 'Chinese', 'Desi Kitchen', 'BBQ', 'Beverages']
  const active = useMemo(() => db.orders.filter(o =>
    o.status !== 'cancelled' && o.kitchenStatus !== 'completed' && o.kitchenStatus !== 'served' &&
    (station === 'All' || o.items.some(it => db.products.find(p => p.id === it.productId)?.station === station))
  ), [db.orders, db.products, station])

  function advance(oId: number, current: KitchenStatus) {
    const idx = KITCHEN_FLOW.indexOf(current)
    const next = KITCHEN_FLOW[Math.min(KITCHEN_FLOW.length - 1, idx + 1)]
    update(d => ({
      ...d,
      orders: d.orders.map(o => o.id === oId ? { ...o, kitchenStatus: next, status: next === 'completed' ? 'completed' : o.status } : o),
    }), `Kitchen ticket ${oId} → ${next}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Kitchen Display <span className="chip ml-2" style={{ background: '#b91c1c1e', color: 'var(--red)' }}><span className="live-dot">●</span> LIVE</span></h1>
        <div className="flex gap-2 flex-wrap">{stations.map(s => (
          <button key={s} className={`btn ${station === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStation(s)}>{s}</button>
        ))}</div>
      </div>
      {active.length === 0 && <Empty text="No active kitchen tickets. New POS / online orders will appear here live." />}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {active.map(o => (
          <div key={o.id} className="card p-4 anim-fade-up" style={{ borderTop: '4px solid var(--accent)' }}>
            <div className="flex justify-between items-start">
              <div><b className="text-lg">{o.number}</b> <StatusChip status={o.kitchenStatus} /></div>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{timeAgo(o.createdAt)}</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {o.type.replace('_', ' ')} · {o.customerName} · Waiter {o.waiterName}{o.tableLabel ? ` · ${o.tableLabel}` : ''}
            </div>
            <div className="mt-3 space-y-2">
              {o.items.map((it, i) => {
                const p = db.products.find(x => x.id === it.productId)
                return (
                  <div key={i} className="flex gap-2 items-center">
                    {p && <FoodImg src={p.image} alt={it.name} className="w-10 h-10 rounded-lg object-cover" />}
                    <div className="flex-1 text-sm"><b>{it.qty}× {it.name}</b>{it.variation && <span> ({it.variation})</span>}{it.modifiers && <div className="text-xs" style={{ color: 'var(--muted)' }}>{it.modifiers}</div>}{it.notes && <div className="text-xs" style={{ color: 'var(--amber)' }}>📝 {it.notes}</div>}</div>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{p?.station || ''}</span>
                  </div>
                )
              })}
            </div>
            <button className="btn btn-primary w-full mt-4" onClick={() => advance(o.id, o.kitchenStatus)}>
              {o.kitchenStatus === 'ready' ? 'Mark served' : o.kitchenStatus === 'served' ? 'Complete' : `Advance → ${KITCHEN_FLOW[KITCHEN_FLOW.indexOf(o.kitchenStatus) + 1]}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OrdersView() {
  const { db, user, update } = useStore()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [sel, setSel] = useState<number | null>(null)
  const canCancel = ['owner', 'admin', 'manager', 'super_admin'].includes(user?.role || '')
  const canRefund = ['owner', 'admin', 'manager', 'accountant', 'super_admin'].includes(user?.role || '')
  const orders = db.orders.filter(o =>
    (status === '' || o.status === status) &&
    (q === '' || o.number.toLowerCase().includes(q.toLowerCase()) || o.customerName.toLowerCase().includes(q.toLowerCase())))
  const cur = db.settings.currency
  const order = sel ? db.orders.find(o => o.id === sel) : undefined
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Order Management</h1>
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-[200px]"><SearchInput value={q} onChange={setQ} placeholder="Search by order no. or customer…" /></div>
        {['', 'pending', 'completed', 'cancelled', 'held'].map(s => (
          <button key={s} className={`btn ${status === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatus(s)}>{s === '' ? 'All' : s}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead><tr className="text-left border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Type</th><th className="p-3">Waiter</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Kitchen</th><th className="p-3">Status</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-b last:border-0 hover:opacity-80 transition-opacity" style={{ borderColor: 'var(--border)' }}>
                <td className="p-3 font-bold">{o.number}</td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3">{o.type.replace('_', ' ')}</td>
                <td className="p-3">{o.waiterName}</td>
                <td className="p-3 font-bold">{fmt(o.total, cur)}</td>
                <td className="p-3"><StatusChip status={o.paymentStatus} /></td>
                <td className="p-3"><StatusChip status={o.kitchenStatus} /></td>
                <td className="p-3"><StatusChip status={o.status} /></td>
                <td className="p-3"><button className="btn btn-ghost !py-1" onClick={() => setSel(o.id)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-sm" style={{ color: 'var(--muted)' }}>No orders match.</p>}
      </div>
      {order && (
        <Modal title={`Order ${order.number}`} onClose={() => setSel(null)} wide>
          <div className="grid sm:grid-cols-2 gap-2 text-sm mb-3">
            <div>Customer: <b>{order.customerName}</b></div>
            <div>Date: <b>{new Date(order.createdAt).toLocaleString()}</b></div>
            <div>Type: <b>{order.type.replace('_', ' ')}</b> {order.tableLabel && `· ${order.tableLabel}`}</div>
            <div>Waiter: <b>{order.waiterName}</b></div>
            <div>Source: <b>{order.source}</b></div>
            <div>Payments: <b>{order.payments.map(p => `${p.method} ${fmt(p.amount, cur)}`).join(' + ') || 'None'}</b></div>
          </div>
          <div className="space-y-1 text-sm border-t pt-3" style={{ borderColor: 'var(--border)' }}>
            {order.items.map((it, i) => <div key={i} className="flex justify-between"><span>{it.qty} × {it.name} {it.variation && `(${it.variation})`} {it.modifiers && `· ${it.modifiers}`}</span><span>{fmt(it.unitPrice * it.qty, cur)}</span></div>)}
            <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}><span>Subtotal</span><span>{fmt(order.subtotal, cur)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{fmt(order.tax, cur)}</span></div>
            <div className="flex justify-between font-extrabold"><span>Total</span><span>{fmt(order.total, cur)}</span></div>
            <div className="flex justify-between"><span>Paid</span><span>{fmt(order.paidAmount, cur)} · <StatusChip status={order.paymentStatus} /></span></div>
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            {order.status === 'pending' && <button className="btn btn-primary" onClick={() => { update(d => ({ ...d, orders: d.orders.map(o => o.id === order.id ? { ...o, status: 'completed', paidAmount: o.total, paymentStatus: 'paid', payments: o.payments.length ? o.payments : [{ method: 'Cash', amount: o.total, at: new Date().toISOString() }] } : o) }), `Order ${order.number} completed`); setSel(null) }}>Mark completed & paid</button>}
            {canCancel && order.status !== 'cancelled' && <button className="btn btn-danger" onClick={() => { const r = prompt('Cancellation reason:') || 'Cancelled by staff'; update(d => ({ ...d, orders: d.orders.map(o => o.id === order.id ? { ...o, status: 'cancelled', cancelReason: r } : o) }), `Order ${order.number} cancelled: ${r}`); setSel(null) }}>Cancel order</button>}
            {canRefund && order.paymentStatus === 'paid' && <button className="btn btn-ghost" onClick={() => { update(d => ({ ...d, orders: d.orders.map(o => o.id === order.id ? { ...o, paymentStatus: 'refunded', paidAmount: 0 } : o) }), `Order ${order.number} refunded ${fmt(order.total, cur)}`); setSel(null) }}>Refund full amount</button>}
          </div>
        </Modal>
      )}
    </div>
  )
}
