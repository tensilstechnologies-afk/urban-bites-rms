import { useMemo, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { DEMO_PASSWORD, USERS } from './data'
import Dashboard from './views/Dashboard'
import POS from './views/POS'
import { KDSView, OrdersView, TablesView } from './views/Ops'
import { InventoryView, MenuView, SuppliersView } from './views/Manage'
import { CustomersView, StaffView } from './views/People'
import { AuditView, ExpensesView, NotificationsView, ReportsView, SettingsView } from './views/Finance'
import Storefront from './views/Storefront'
import type { Role } from './types'

type View = 'dashboard' | 'pos' | 'orders' | 'kitchen' | 'tables' | 'menu' | 'inventory' | 'suppliers' | 'customers' | 'staff' | 'expenses' | 'reports' | 'notifications' | 'settings' | 'audit' | 'storefront'

const NAV: { id: View; label: string; icon: string; roles: Role[] }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['owner', 'admin', 'manager', 'super_admin', 'accountant'] },
  { id: 'pos', label: 'POS', icon: '🧾', roles: ['owner', 'admin', 'manager', 'cashier', 'waiter', 'super_admin'] },
  { id: 'orders', label: 'Orders', icon: '📦', roles: ['owner', 'admin', 'manager', 'cashier', 'waiter', 'accountant', 'super_admin'] },
  { id: 'kitchen', label: 'Kitchen (KDS)', icon: '👨‍🍳', roles: ['owner', 'admin', 'manager', 'chef', 'kitchen', 'waiter', 'super_admin'] },
  { id: 'tables', label: 'Tables', icon: '🪑', roles: ['owner', 'admin', 'manager', 'waiter', 'super_admin'] },
  { id: 'menu', label: 'Menu', icon: '🍔', roles: ['owner', 'admin', 'manager', 'chef', 'super_admin'] },
  { id: 'inventory', label: 'Inventory', icon: '📦', roles: ['owner', 'admin', 'manager', 'inventory', 'super_admin'] },
  { id: 'suppliers', label: 'Suppliers', icon: '🚚', roles: ['owner', 'admin', 'manager', 'inventory', 'accountant', 'super_admin'] },
  { id: 'customers', label: 'Customers', icon: '👥', roles: ['owner', 'admin', 'manager', 'cashier', 'waiter', 'super_admin'] },
  { id: 'staff', label: 'Staff', icon: '🧑‍🤝‍🧑', roles: ['owner', 'admin', 'manager', 'super_admin'] },
  { id: 'expenses', label: 'Expenses', icon: '💸', roles: ['owner', 'admin', 'manager', 'accountant', 'super_admin'] },
  { id: 'reports', label: 'Reports', icon: '📈', roles: ['owner', 'admin', 'manager', 'accountant', 'super_admin'] },
  { id: 'storefront', label: 'Online Menu', icon: '🌐', roles: ['owner', 'admin', 'manager', 'cashier', 'waiter', 'chef', 'kitchen', 'inventory', 'accountant', 'super_admin'] },
  { id: 'notifications', label: 'Notifications', icon: '🔔', roles: ['owner', 'admin', 'manager', 'cashier', 'waiter', 'chef', 'kitchen', 'inventory', 'accountant', 'super_admin'] },
  { id: 'settings', label: 'Settings', icon: '⚙️', roles: ['owner', 'admin', 'super_admin'] },
  { id: 'audit', label: 'Audit Log', icon: '📋', roles: ['owner', 'admin', 'super_admin'] },
]

function defaultView(role: Role): View {
  if (role === 'waiter' || role === 'cashier') return 'pos'
  if (role === 'chef' || role === 'kitchen') return 'kitchen'
  if (role === 'inventory') return 'inventory'
  if (role === 'accountant') return 'reports'
  return 'dashboard'
}

function Login({ onGuest }: { onGuest: () => void }) {
  const { login } = useStore()
  const [email, setEmail] = useState('owner@urbanbites.pk')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [err, setErr] = useState('')
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #7c2d12, #c2410c 55%, #92400e)' }}>
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 overflow-hidden rounded-3xl shadow-2xl anim-fade-up" style={{ background: 'var(--surface)' }}>
        <div className="relative hidden md:block">
          <img src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80" alt="Urban Bites BBQ" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.8), transparent)' }}>
            <div className="text-white"><b className="text-2xl">Urban Bites</b><p className="text-white/80 text-sm">Fire, flavour & fast service — Gulberg III, Lahore</p></div>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <h1 className="text-2xl font-extrabold">🍔 Urban Bites RMS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Restaurant Management System — sign in to continue</p>
          <form className="mt-6 space-y-3" onSubmit={e => { e.preventDefault(); const m = login(email, password); setErr(m || '') }}>
            <div><div className="label">Email</div><input className="input" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><div className="label">Password</div><input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} /></div>
            {err && <p className="text-sm font-semibold" style={{ color: 'var(--red)' }}>{err}</p>}
            <button className="btn btn-primary w-full !py-3" type="submit">Sign in →</button>
          </form>
          <button className="btn btn-ghost w-full mt-2" onClick={onGuest}>🌐 Browse online menu as a guest</button>
          <div className="mt-5">
            <div className="label mb-2">Demo accounts — password for all: <b>demo1234</b></div>
            <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto pr-1">
              {USERS.map(u => (
                <button key={u.id} className="text-left text-xs p-2 rounded-lg hover:opacity-80 transition-opacity" style={{ background: 'var(--surface2)' }}
                  onClick={() => { setEmail(u.email); setPassword(DEMO_PASSWORD); setErr('') }}>
                  <b>{u.roleLabel}</b> — {u.name} · {u.email}
                </button>
              ))}
            </div>
            <p className="text-[11px] mt-3" style={{ color: 'var(--muted)' }}>Demo build: permissions are enforced client-side in this static build. A production deployment should enforce them server-side.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Shell({ guest, onExitGuest }: { guest: boolean; onExitGuest: () => void }) {
  const { user, logout, theme, toggleTheme, db } = useStore()
  const [view, setView] = useState<View>(() => user ? defaultView(user.role) : 'storefront')
  const nav = useMemo(() => user ? NAV.filter(n => n.roles.includes(user.role)) : [], [user])
  const unread = db.notifications.filter(n => !n.read).length

  if (!user && !guest) return null
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <aside className="w-full md:w-60 shrink-0 p-3 md:p-4 md:min-h-screen md:sticky md:top-0" style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 px-1">
          <span className="text-2xl">🍔</span>
          <div><b>Urban Bites</b><div className="text-[11px]" style={{ color: 'var(--muted)' }}>Restaurant RMS · {db.settings.currency}</div></div>
        </div>
        <nav className="flex md:flex-col gap-1 mt-4 overflow-x-auto md:overflow-visible pb-1">
          {nav.map(n => (
            <button key={n.id} onClick={() => setView(n.id)}
              className={`btn !justify-start shrink-0 ${view === n.id ? 'btn-primary' : 'btn-ghost'} !border-0`}>
              <span>{n.icon}</span> {n.label}
              {n.id === 'notifications' && unread > 0 && <span className="ml-auto chip" style={{ background: '#b91c1c', color: '#fff' }}>{unread}</span>}
            </button>
          ))}
          {!user && <button className="btn btn-ghost !justify-start shrink-0" onClick={onExitGuest}>← Back to sign in</button>}
        </nav>
        {user && (
          <div className="hidden md:block mt-6 p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
            <b className="text-sm">{user.name}</b>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{user.roleLabel} · {user.email}</div>
            <button className="btn btn-ghost w-full mt-3 !py-1.5" onClick={logout}>Sign out</button>
          </div>
        )}
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between gap-3 px-4 py-3 sticky top-0 z-40" style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
          <b className="text-sm sm:text-base">{NAV.find(n => n.id === view)?.label || 'Urban Bites'}</b>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost !py-1.5" onClick={() => setView('notifications')} title="Notifications">🔔 {unread > 0 && <span className="chip" style={{ background: '#b91c1c', color: '#fff' }}>{unread}</span>}</button>
            <button className="btn btn-ghost !py-1.5" onClick={toggleTheme} title="Switch theme">{theme === 'light' ? '🌙 Dark' : '☀️ Light'}</button>
            {user && <button className="btn btn-ghost !py-1.5 md:hidden" onClick={logout}>Sign out</button>}
          </div>
        </header>
        <main className="p-4 md:p-6 max-w-7xl w-full mx-auto anim-fade-in" key={view}>
          {view === 'dashboard' && <Dashboard />}
          {view === 'pos' && <POS />}
          {view === 'orders' && <OrdersView />}
          {view === 'kitchen' && <KDSView />}
          {view === 'tables' && <TablesView />}
          {view === 'menu' && <MenuView />}
          {view === 'inventory' && <InventoryView />}
          {view === 'suppliers' && <SuppliersView />}
          {view === 'customers' && <CustomersView />}
          {view === 'staff' && <StaffView />}
          {view === 'expenses' && <ExpensesView />}
          {view === 'reports' && <ReportsView />}
          {view === 'storefront' && <Storefront />}
          {view === 'notifications' && <NotificationsView />}
          {view === 'settings' && <SettingsView />}
          {view === 'audit' && <AuditView />}
        </main>
        <footer className="p-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
          Urban Bites Restaurant Management System · {db.settings.address} · {db.settings.phone} · Demo build — data is stored in your browser (localStorage)
        </footer>
      </div>
    </div>
  )
}

function AppInner() {
  const { user } = useStore()
  const [guest, setGuest] = useState(false)
  if (!user && !guest) return <Login onGuest={() => setGuest(true)} />
  return <Shell guest={guest} onExitGuest={() => setGuest(false)} />
}

export default function App() {
  return <StoreProvider><AppInner /></StoreProvider>
}
