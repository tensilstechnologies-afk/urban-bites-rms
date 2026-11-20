import { useState } from 'react'
import { fmt, useStore } from '../store'
import { Modal } from '../components'

export function CustomersView() {
  const { db, update } = useStore()
  const [edit, setEdit] = useState<{ id?: number; name: string; phone: string; notes: string } | null>(null)
  const [pts, setPts] = useState<number | null>(null)
  const [ptsVal, setPtsVal] = useState(100)
  const cur = db.settings.currency
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Customers (CRM)</h1>
        <button className="btn btn-primary" onClick={() => setEdit({ name: '', phone: '', notes: '' })}>+ Add customer</button>
      </div>
      <p className="text-sm" style={{ color: 'var(--muted)' }}>Loyalty: {db.settings.loyaltyPer1000} points per {fmt(1000, cur)} spent · 100 points = {fmt(db.settings.loyaltyValue, cur)} value</p>
      <div className="grid md:grid-cols-2 gap-3">
        {db.customers.map(c => {
          const orders = db.orders.filter(o => o.customerId === c.id)
          const spent = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0)
          const fav = orders.flatMap(o => o.items).sort((a, b) => b.qty - a.qty)[0]
          return (
            <div key={c.id} className="card card-hover p-4 anim-fade-up">
              <div className="flex justify-between"><b>{c.name}</b><span className="chip" style={{ background: 'var(--surface2)' }}>{c.segment}</span></div>
              <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{c.phone} · {c.email}</div>
              <div className="text-sm mt-2 grid grid-cols-3 gap-2">
                <div><div className="label">Spent</div><b>{fmt(spent, cur)}</b></div>
                <div><div className="label">Orders</div><b>{orders.length}</b></div>
                <div><div className="label">Points</div><b style={{ color: 'var(--accent)' }}>{c.points}</b></div>
              </div>
              <div className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Favourite: {fav?.name || '—'}{c.notes ? ` · ${c.notes}` : ''}</div>
              <div className="flex gap-2 mt-3">
                <button className="btn btn-ghost !py-1" onClick={() => setEdit({ id: c.id, name: c.name, phone: c.phone, notes: c.notes })}>Edit</button>
                <button className="btn btn-ghost !py-1" onClick={() => { setPts(c.id); setPtsVal(100) }}>Adjust points</button>
              </div>
            </div>
          )
        })}
      </div>
      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name}` : 'Add customer'} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <div><div className="label">Name</div><input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
            <div><div className="label">Phone</div><input className="input" value={edit.phone} onChange={e => setEdit({ ...edit, phone: e.target.value })} /></div>
            <div><div className="label">Notes</div><textarea className="input" value={edit.notes} onChange={e => setEdit({ ...edit, notes: e.target.value })} /></div>
            <button className="btn btn-primary w-full" onClick={() => {
              if (!edit.name.trim()) return
              update(d => edit.id
                ? { ...d, customers: d.customers.map(c => c.id === edit.id ? { ...c, name: edit.name, phone: edit.phone, notes: edit.notes } : c) }
                : { ...d, customers: [...d.customers, { id: Math.max(...d.customers.map(c => c.id)) + 1, name: edit.name, phone: edit.phone, email: '', points: 0, segment: 'New', notes: edit.notes }] },
                edit.id ? `Customer ${edit.name} updated` : `Customer ${edit.name} created`)
              setEdit(null)
            }}>Save customer</button>
          </div>
        </Modal>
      )}
      {pts !== null && (
        <Modal title="Adjust loyalty points" onClose={() => setPts(null)}>
          <div className="space-y-3">
            <div><div className="label">Points (negative to redeem)</div><input type="number" className="input" value={ptsVal} onChange={e => setPtsVal(Number(e.target.value))} /></div>
            <button className="btn btn-primary w-full" onClick={() => {
              update(d => ({ ...d, customers: d.customers.map(c => c.id === pts ? { ...c, points: Math.max(0, c.points + ptsVal) } : c) }), `Loyalty points adjusted ${ptsVal > 0 ? '+' : ''}${ptsVal}`)
              setPts(null)
            }}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function StaffView() {
  const { db, update, user } = useStore()
  const today = new Date().toISOString().slice(0, 10)
  const [newStaff, setNewStaff] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('waiter')
  const canManage = ['owner', 'admin', 'manager', 'super_admin'].includes(user?.role || '')
  const waiterStats = (name: string) => {
    const os = db.orders.filter(o => o.waiterName === name && o.status === 'completed')
    return { orders: os.length, sales: os.reduce((s, o) => s + o.total, 0) }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Staff & Attendance</h1>
        {canManage && <button className="btn btn-primary" onClick={() => setNewStaff(true)}>+ Add staff</button>}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead><tr className="text-left border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Phone</th><th className="p-3">Salary</th><th className="p-3">Performance</th><th className="p-3">Today</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {db.users.map(u => {
              const att = db.attendance.find(a => a.userId === u.id && a.date === today)
              const st = waiterStats(u.name)
              return (
                <tr key={u.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3 font-bold">{u.name}</td>
                  <td className="p-3">{u.roleLabel}</td>
                  <td className="p-3">{u.phone}</td>
                  <td className="p-3">{u.salary ? fmt(u.salary, db.settings.currency) : '—'}</td>
                  <td className="p-3">{u.role === 'waiter' ? `${st.orders} orders · ${fmt(st.sales, db.settings.currency)}` : '—'}</td>
                  <td className="p-3">{att?.in ? `In ${att.in}${att.out ? ` · Out ${att.out}` : ' · on shift'}` : 'Not checked in'}</td>
                  <td className="p-3 flex gap-1">
                    {!att?.in && <button className="btn btn-ghost !py-1" onClick={() => update(d => ({ ...d, attendance: [...d.attendance, { userId: u.id, name: u.name, date: today, in: new Date().toTimeString().slice(0, 5), out: null }] }), `${u.name} checked in`)}>Check in</button>}
                    {att?.in && !att.out && <button className="btn btn-ghost !py-1" onClick={() => update(d => ({ ...d, attendance: d.attendance.map(a => a.userId === u.id && a.date === today ? { ...a, out: new Date().toTimeString().slice(0, 5) } : a) }), `${u.name} checked out`)}>Check out</button>}
                    {canManage && <button className="btn btn-ghost !py-1" onClick={() => update(d => ({ ...d, users: d.users.map(x => x.id === u.id ? { ...x, active: !x.active } : x) }), `Staff ${u.name} ${u.active ? 'deactivated' : 'activated'}`)}>{u.active ? 'Deactivate' : 'Activate'}</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {db.attendance.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No attendance records yet today — use Check in / Check out above.</p>}
      {newStaff && (
        <Modal title="Add staff member" onClose={() => setNewStaff(false)}>
          <div className="space-y-3">
            <div><div className="label">Full name</div><input className="input" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><div className="label">Email (login)</div><input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@urbanbites.pk" /></div>
            <div><div className="label">Role</div><select className="input" value={role} onChange={e => setRole(e.target.value)}>
              {['waiter', 'cashier', 'chef', 'kitchen', 'inventory', 'accountant', 'manager', 'admin'].map(r => <option key={r} value={r}>{r}</option>)}
            </select></div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Demo login password for every new account: <b>demo1234</b></p>
            <button className="btn btn-primary w-full" disabled={!name.trim() || !email.includes('@')} onClick={() => {
              update(d => ({ ...d, users: [...d.users, { id: Math.max(...d.users.map(x => x.id)) + 1, name, email, role: role as never, roleLabel: role, phone: '', salary: 0, active: true, joinedAt: today }] }), `Staff ${name} added (${role})`)
              setNewStaff(false); setName(''); setEmail('')
            }}>Add staff</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
