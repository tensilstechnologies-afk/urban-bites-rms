import { useState } from 'react'
import { fmt, useStore } from '../store'
import { Empty, FoodImg, Modal, SearchInput, StatusChip } from '../components'
import type { Product } from '../types'

export function MenuView() {
  const { db, update } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<number | null>(null)
  const [edit, setEdit] = useState<Partial<Product> | null>(null)
  const [newCat, setNewCat] = useState('')
  const cur = db.settings.currency
  const products = db.products.filter(p => (cat === null || p.categoryId === cat) && p.name.toLowerCase().includes(q.toLowerCase()))

  function saveProduct() {
    if (!edit?.name || !edit.price) return
    update(d => {
      if (edit.id) return { ...d, products: d.products.map(p => p.id === edit.id ? { ...p, ...edit, price: Number(edit.price), costPrice: Number(edit.costPrice || 0) } as Product : p) }
      const id = Math.max(...d.products.map(p => p.id)) + 1
      return { ...d, products: [...d.products, { id, name: edit.name!, categoryId: edit.categoryId || 1, price: Number(edit.price), costPrice: Number(edit.costPrice || 0), description: edit.description || '', image: edit.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', prepMins: Number(edit.prepMins || 10), station: edit.station || 'Fast Food', dietary: edit.dietary || '', available: true, sku: `UB-NEW-${id}`, featured: false, variations: [], recipe: [] }] }
    }, edit.id ? `Product ${edit.name} updated` : `Product ${edit.name} created`)
    setEdit(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Menu Management</h1>
        <button className="btn btn-primary" onClick={() => setEdit({ name: '', price: 0, costPrice: 0, categoryId: 1, description: '', prepMins: 10, station: 'Fast Food' })}>+ Add product</button>
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex-1 min-w-[200px]"><SearchInput value={q} onChange={setQ} placeholder="Search products…" /></div>
        <button className={`btn ${cat === null ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(null)}>All</button>
        {db.categories.map(c => <button key={c.id} className={`btn ${cat === c.id ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setCat(c.id)}>{c.name}</button>)}
      </div>
      <div className="card p-3 flex gap-2 flex-wrap items-center">
        <input className="input !w-56" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category name…" />
        <button className="btn btn-ghost" onClick={() => {
          if (!newCat.trim()) return
          update(d => ({ ...d, categories: [...d.categories, { id: Math.max(...d.categories.map(c => c.id)) + 1, name: newCat.trim(), image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80' }] }), `Category ${newCat} created`)
          setNewCat('')
        }}>+ Add category</button>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>Modifiers: {db.modifiers.map(m => `${m.name}${m.price ? ` +${fmt(m.price, cur)}` : ''}`).join(' · ')}</span>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {products.map(p => (
          <div key={p.id} className="card card-hover p-3 flex gap-3 anim-fade-up">
            <FoodImg src={p.image} alt={p.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <b className="text-sm">{p.name}</b>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{db.categories.find(c => c.id === p.categoryId)?.name} · {p.station} · {p.prepMins} min</div>
              <div className="text-sm mt-1"><b style={{ color: 'var(--accent)' }}>{fmt(p.price, cur)}</b> <span style={{ color: 'var(--muted)' }}>cost {fmt(p.costPrice, cur)}</span></div>
              <div className="text-xs mt-1">Recipe: {p.recipe.length ? p.recipe.map(r => `${db.ingredients.find(i => i.id === r.ingredientId)?.name} ${r.qty}`).join(', ') : '—'}</div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-ghost !py-1 !px-2 text-xs" onClick={() => setEdit({ ...p })}>Edit</button>
                <button className="btn btn-ghost !py-1 !px-2 text-xs" onClick={() => update(d => ({ ...d, products: d.products.map(x => x.id === p.id ? { ...x, available: !x.available } : x) }), `Product ${p.name} ${p.available ? '86’d' : 'back on menu'}`)}>{p.available ? 'Mark 86’d' : 'Back on menu'}</button>
                <button className="btn btn-ghost !py-1 !px-2 text-xs" style={{ color: 'var(--red)' }} onClick={() => { if (confirm(`Delete ${p.name}?`)) update(d => ({ ...d, products: d.products.filter(x => x.id !== p.id) }), `Product ${p.name} deleted`) }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {products.length === 0 && <Empty text="No products found." />}
      {edit && (
        <Modal title={edit.id ? `Edit ${edit.name}` : 'Add product'} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <div><div className="label">Name</div><input className="input" value={edit.name || ''} onChange={e => setEdit({ ...edit, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="label">Price ({cur})</div><input type="number" className="input" value={edit.price || 0} onChange={e => setEdit({ ...edit, price: Number(e.target.value) })} /></div>
              <div><div className="label">Cost price ({cur})</div><input type="number" className="input" value={edit.costPrice || 0} onChange={e => setEdit({ ...edit, costPrice: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="label">Category</div><select className="input" value={edit.categoryId || 1} onChange={e => setEdit({ ...edit, categoryId: Number(e.target.value) })}>{db.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><div className="label">Kitchen station</div><select className="input" value={edit.station || 'Fast Food'} onChange={e => setEdit({ ...edit, station: e.target.value })}>{['Fast Food', 'Chinese', 'Desi Kitchen', 'BBQ', 'Beverages'].map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div><div className="label">Description</div><textarea className="input" value={edit.description || ''} onChange={e => setEdit({ ...edit, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="label">Prep time (min)</div><input type="number" className="input" value={edit.prepMins || 10} onChange={e => setEdit({ ...edit, prepMins: Number(e.target.value) })} /></div>
              <div><div className="label">Image URL</div><input className="input" value={edit.image || ''} onChange={e => setEdit({ ...edit, image: e.target.value })} placeholder="https://…" /></div>
            </div>
            <button className="btn btn-primary w-full" onClick={saveProduct}>Save product</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function InventoryView() {
  const { db, update } = useStore()
  const [adjust, setAdjust] = useState<number | null>(null)
  const [qty, setQty] = useState(0)
  const [reason, setReason] = useState('Purchase')
  const [newIng, setNewIng] = useState<null | { name: string; qty: number; unit: string; minLevel: number; unitCost: number; expiry: string }>(null)
  const cur = db.settings.currency
  const totalValue = db.ingredients.reduce((s, i) => s + i.qty * i.unitCost, 0)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Inventory</h1>
        <div className="flex gap-2 items-center">
          <span className="chip" style={{ background: 'var(--surface2)' }}>Total value: <b>{fmt(totalValue, cur)}</b></span>
          <button className="btn btn-primary" onClick={() => setNewIng({ name: '', qty: 0, unit: 'kg', minLevel: 0, unitCost: 0, expiry: '' })}>+ Add ingredient</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead><tr className="text-left border-b" style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}>
            <th className="p-3">Ingredient</th><th className="p-3">Stock</th><th className="p-3">Min level</th><th className="p-3">Unit cost</th><th className="p-3">Value</th><th className="p-3">Expiry</th><th className="p-3">Status</th><th className="p-3"></th>
          </tr></thead>
          <tbody>
            {db.ingredients.map(i => {
              const low = i.qty <= i.minLevel
              const expiring = i.expiry && new Date(i.expiry).getTime() - Date.now() < 7 * 86400000
              return (
                <tr key={i.id} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <td className="p-3 font-bold">{i.name}</td>
                  <td className="p-3">{i.qty} {i.unit}</td>
                  <td className="p-3">{i.minLevel} {i.unit}</td>
                  <td className="p-3">{fmt(i.unitCost, cur)}</td>
                  <td className="p-3">{fmt(i.qty * i.unitCost, cur)}</td>
                  <td className="p-3">{i.expiry || '—'}</td>
                  <td className="p-3">{low ? <StatusChip status="unpaid" /> : expiring ? <span className="chip" style={{ background: '#b453091e', color: 'var(--amber)' }}>expiring</span> : <StatusChip status="paid" />}{low && <span className="text-xs block" style={{ color: 'var(--red)' }}>Low stock</span>}</td>
                  <td className="p-3"><button className="btn btn-ghost !py-1" onClick={() => { setAdjust(i.id); setQty(0) }}>Adjust</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="card p-4">
        <h3 className="font-bold mb-2">Recent stock movements</h3>
        {db.movements.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No movements yet — confirming a POS order deducts recipe stock automatically and logs it here.</p>}
        {db.movements.slice(0, 10).map(m => (
          <div key={m.id} className="flex justify-between text-sm py-1 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <span>{m.ingredient} · {m.reason}</span><b style={{ color: m.change < 0 ? 'var(--red)' : 'var(--green)' }}>{m.change > 0 ? '+' : ''}{m.change} {m.unit}</b>
          </div>
        ))}
      </div>
      {newIng && (
        <Modal title="Add ingredient" onClose={() => setNewIng(null)}>
          <div className="space-y-3">
            <div><div className="label">Name</div><input className="input" value={newIng.name} onChange={e => setNewIng({ ...newIng, name: e.target.value })} placeholder="e.g. Tomatoes" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="label">Opening stock</div><input type="number" step="0.1" className="input" value={newIng.qty} onChange={e => setNewIng({ ...newIng, qty: Number(e.target.value) })} /></div>
              <div><div className="label">Unit</div><select className="input" value={newIng.unit} onChange={e => setNewIng({ ...newIng, unit: e.target.value })}>{['kg', 'L', 'pcs', 'g', 'pack'].map(u => <option key={u}>{u}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><div className="label">Min level (low-stock alert)</div><input type="number" step="0.1" className="input" value={newIng.minLevel} onChange={e => setNewIng({ ...newIng, minLevel: Number(e.target.value) })} /></div>
              <div><div className="label">Unit cost ({cur})</div><input type="number" className="input" value={newIng.unitCost} onChange={e => setNewIng({ ...newIng, unitCost: Number(e.target.value) })} /></div>
            </div>
            <div><div className="label">Expiry date (optional)</div><input type="date" className="input" value={newIng.expiry} onChange={e => setNewIng({ ...newIng, expiry: e.target.value })} /></div>
            <button className="btn btn-primary w-full" onClick={() => {
              if (!newIng.name.trim()) return
              update(d => ({ ...d, ingredients: [...d.ingredients, { id: Math.max(...d.ingredients.map(i => i.id)) + 1, name: newIng.name.trim(), qty: newIng.qty, unit: newIng.unit, minLevel: newIng.minLevel, unitCost: newIng.unitCost, expiry: newIng.expiry || null }] }), `Ingredient ${newIng.name} added`)
              setNewIng(null)
            }}>Save ingredient</button>
          </div>
        </Modal>
      )}
      {adjust !== null && (
        <Modal title={`Adjust stock — ${db.ingredients.find(i => i.id === adjust)?.name}`} onClose={() => setAdjust(null)}>
          <div className="space-y-3">
            <div><div className="label">Quantity change (use negative for wastage / damage)</div>
              <input type="number" step="0.1" className="input" value={qty} onChange={e => setQty(Number(e.target.value))} /></div>
            <div><div className="label">Reason</div>
              <select className="input" value={reason} onChange={e => setReason(e.target.value)}>
                <option>Purchase</option><option>Adjustment</option><option>Wastage</option><option>Damage</option>
              </select></div>
            <button className="btn btn-primary w-full" onClick={() => {
              const ing = db.ingredients.find(i => i.id === adjust)!
              update(d => ({
                ...d,
                ingredients: d.ingredients.map(i => i.id === adjust ? { ...i, qty: Math.max(0, Math.round((i.qty + qty) * 100) / 100) } : i),
                movements: [{ id: Date.now(), ingredient: ing.name, change: qty, unit: ing.unit, reason, at: new Date().toISOString() }, ...d.movements].slice(0, 200),
              }), `Stock ${ing.name} adjusted ${qty > 0 ? '+' : ''}${qty} ${ing.unit} (${reason})`)
              setAdjust(null)
            }}>Save adjustment</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export function SuppliersView() {
  const { db, update } = useStore()
  const [po, setPo] = useState(false)
  const [supId, setSupId] = useState(1)
  const [items, setItems] = useState('')
  const [total, setTotal] = useState(0)
  const [newSup, setNewSup] = useState<null | { name: string; contact: string; phone: string; email: string }>(null)
  const cur = db.settings.currency
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Suppliers & Purchases</h1>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => setNewSup({ name: '', contact: '', phone: '', email: '' })}>+ Add supplier</button>
          <button className="btn btn-primary" onClick={() => setPo(true)}>+ New purchase order</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {db.suppliers.map(s => (
          <div key={s.id} className="card card-hover p-4 anim-fade-up">
            <div className="flex justify-between"><b>{s.name}</b><span className="chip" style={{ background: s.balance > 0 ? '#b453091e' : '#15803d1e', color: s.balance > 0 ? 'var(--amber)' : 'var(--green)' }}>Due {fmt(s.balance, cur)}</span></div>
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{s.contact} · {s.phone} · {s.email}</div>
            <button className="btn btn-ghost !py-1 mt-3" disabled={s.balance <= 0} onClick={() => update(d => ({ ...d, suppliers: d.suppliers.map(x => x.id === s.id ? { ...x, balance: 0 } : x) }), `Supplier ${s.name} paid in full ${fmt(s.balance, cur)}`)}>Record full payment</button>
          </div>
        ))}
      </div>
      <div className="card p-4">
        <h3 className="font-bold mb-2">Purchase history</h3>
        {db.purchases.map(p => (
          <div key={p.id} className="flex flex-wrap justify-between gap-2 text-sm py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
            <span><b>{p.supplierName}</b> · {p.items} · {p.date}</span>
            <span><StatusChip status={p.status.toLowerCase() === 'received' ? 'paid' : 'partial'} /> <b>{fmt(p.total, cur)}</b> <span style={{ color: 'var(--muted)' }}>paid {fmt(p.paid, cur)}</span></span>
          </div>
        ))}
      </div>
      {newSup && (
        <Modal title="Add supplier" onClose={() => setNewSup(null)}>
          <div className="space-y-3">
            <div><div className="label">Supplier / company name</div><input className="input" value={newSup.name} onChange={e => setNewSup({ ...newSup, name: e.target.value })} /></div>
            <div><div className="label">Contact person</div><input className="input" value={newSup.contact} onChange={e => setNewSup({ ...newSup, contact: e.target.value })} /></div>
            <div><div className="label">Phone</div><input className="input" value={newSup.phone} onChange={e => setNewSup({ ...newSup, phone: e.target.value })} /></div>
            <div><div className="label">Email</div><input className="input" value={newSup.email} onChange={e => setNewSup({ ...newSup, email: e.target.value })} /></div>
            <button className="btn btn-primary w-full" onClick={() => {
              if (!newSup.name.trim()) return
              update(d => ({ ...d, suppliers: [...d.suppliers, { id: Math.max(...d.suppliers.map(s => s.id)) + 1, name: newSup.name.trim(), contact: newSup.contact, phone: newSup.phone, email: newSup.email, balance: 0 }] }), `Supplier ${newSup.name} added`)
              setNewSup(null)
            }}>Save supplier</button>
          </div>
        </Modal>
      )}
      {po && (
        <Modal title="New purchase order" onClose={() => setPo(false)}>
          <div className="space-y-3">
            <div><div className="label">Supplier</div><select className="input" value={supId} onChange={e => setSupId(Number(e.target.value))}>{db.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><div className="label">Items</div><input className="input" value={items} onChange={e => setItems(e.target.value)} placeholder="e.g. Chicken 40kg" /></div>
            <div><div className="label">Total ({cur})</div><input type="number" className="input" value={total} onChange={e => setTotal(Number(e.target.value))} /></div>
            <button className="btn btn-primary w-full" disabled={!items || total <= 0} onClick={() => {
              const s = db.suppliers.find(x => x.id === supId)!
              update(d => ({
                ...d,
                purchases: [{ id: Date.now(), supplierId: supId, supplierName: s.name, items, total, paid: 0, date: new Date().toISOString().slice(0, 10), status: 'Ordered' }, ...d.purchases],
                suppliers: d.suppliers.map(x => x.id === supId ? { ...x, balance: x.balance + total } : x),
              }), `Purchase order ${fmt(total, cur)} from ${s.name}`)
              setPo(false); setItems(''); setTotal(0)
            }}>Create & receive (adds to supplier balance)</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
