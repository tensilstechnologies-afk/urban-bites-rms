import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Attendance, AuditEntry, Category, Customer, Expense, Ingredient, Modifier, Notification, Order, OrderItem, OrderType, Product, Purchase, Reservation, Settings, StockMovement, Supplier, Table, User } from './types'
import { CATEGORIES, CUSTOMERS, EXPENSES, INGREDIENTS, MODIFIERS, PRODUCTS, PURCHASES, RESERVATIONS, SUPPLIERS, TABLES, USERS, buildSeedOrders } from './data'

export interface DB {
  products: Product[]; categories: Category[]; modifiers: Modifier[]
  ingredients: Ingredient[]; orders: Order[]; tables: Table[]
  customers: Customer[]; suppliers: Supplier[]; purchases: Purchase[]
  expenses: Expense[]; notifications: Notification[]; audit: AuditEntry[]
  settings: Settings; users: User[]; reservations: Reservation[]
  attendance: Attendance[]; movements: StockMovement[]
}

const DEFAULT_SETTINGS: Settings = {
  name: 'Urban Bites Restaurant', tagline: 'Fire, flavour & fast service',
  address: '14-B Food Street, Gulberg III, Lahore', phone: '+92 42 3577 8899',
  email: 'hello@urbanbites.pk', hours: 'Mon–Sun · 11:00 AM – 12:00 AM',
  currency: 'PKR', taxRate: 5, serviceRate: 5, deliveryFee: 200,
  loyaltyPer1000: 10, loyaltyValue: 10,
}

const KEY = 'urban-bites-rms-v1'
const THEME_KEY = 'urban-bites-theme'

function seedDB(): DB {
  return {
    products: PRODUCTS, categories: CATEGORIES, modifiers: MODIFIERS,
    ingredients: INGREDIENTS, orders: buildSeedOrders(), tables: TABLES,
    customers: CUSTOMERS, suppliers: SUPPLIERS, purchases: PURCHASES,
    expenses: EXPENSES,
    notifications: [
      { id: 1, text: 'Low stock: Cheese is at 3.5 kg (min 6 kg).', kind: 'stock', read: false, at: '2026-11-19T09:00:00' },
      { id: 2, text: 'Low stock: Cooking Oil is at 14 L (min 18 L).', kind: 'stock', read: false, at: '2026-11-19T09:05:00' },
      { id: 3, text: 'Milk expires on 22 Nov 2026 — use first.', kind: 'stock', read: false, at: '2026-11-19T09:10:00' },
      { id: 4, text: 'New online order received.', kind: 'order', read: false, at: '2026-11-18T20:12:00' },
    ],
    audit: [{ id: 1, actor: 'System', action: 'Demo data seeded', at: '2026-11-13T08:00:00' }],
    settings: DEFAULT_SETTINGS, users: USERS, reservations: RESERVATIONS,
    attendance: [], movements: [],
  }
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as DB
      // Merge in any seed items added by a newer deploy (e.g. new menu
      // products) so returning browsers get them without losing orders.
      const seed = seedDB()
      const missing = <T extends { id: number }>(have: T[], fresh: T[]) =>
        fresh.filter(f => !have.some(h => h.id === f.id))
      return {
        ...saved,
        products: [...saved.products, ...missing(saved.products, seed.products)],
        categories: [...saved.categories, ...missing(saved.categories, seed.categories)],
        modifiers: [...saved.modifiers, ...missing(saved.modifiers, seed.modifiers)],
        ingredients: [...saved.ingredients, ...missing(saved.ingredients, seed.ingredients)],
      }
    }
  } catch { /* ignore */ }
  return seedDB()
}

export const fmt = (n: number, currency = 'PKR') =>
  `${currency} ${Math.round(n).toLocaleString('en-PK')}`

interface StoreCtx {
  db: DB; user: User | null; theme: 'light' | 'dark'
  login: (email: string, password: string) => string | null
  logout: () => void; toggleTheme: () => void
  update: (fn: (d: DB) => DB, auditAction?: string) => void
  resetDemo: () => void
}

const Ctx = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(loadDB)
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('urban-bites-user') || 'null') } catch { return null }
  })
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light')

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)) }, [db])
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem(THEME_KEY, theme) }, [theme])
  useEffect(() => { localStorage.setItem('urban-bites-user', JSON.stringify(user)) }, [user])

  const value = useMemo<StoreCtx>(() => ({
    db, user, theme,
    toggleTheme: () => setTheme(t => (t === 'light' ? 'dark' : 'light')),
    login: (email, password) => {
      const u = USERS.find(x => x.email.toLowerCase() === email.trim().toLowerCase())
      if (!u) return 'No account with that email.'
      if (password !== 'demo1234') return 'Wrong password. Demo password is demo1234.'
      if (!u.active) return 'This account is deactivated.'
      setUser(u)
      return null
    },
    logout: () => setUser(null),
    update: (fn, auditAction) => setDb(d => {
      const next = fn(d)
      if (auditAction) {
        next.audit = [{ id: Date.now(), actor: user?.name || 'System', action: auditAction, at: new Date().toISOString() }, ...next.audit].slice(0, 200)
      }
      return next
    }),
    resetDemo: () => { localStorage.removeItem(KEY); setDb(seedDB()) },
  }), [db, user, theme])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore outside provider')
  return ctx
}

// Shared order math — used by POS and storefront so totals always match.
export function calcTotals(items: OrderItem[], discountPct: number, taxRate: number, deliveryFee: number, serviceRate: number) {
  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0)
  const discount = Math.round((subtotal * discountPct) / 100)
  const afterDiscount = subtotal - discount
  const tax = Math.round((afterDiscount * taxRate) / 100)
  const serviceCharge = Math.round((afterDiscount * serviceRate) / 100)
  const total = afterDiscount + tax + serviceCharge + deliveryFee
  return { subtotal, discount, tax, serviceCharge, total }
}

export function deductStock(db: DB, items: OrderItem[]): DB {
  const ingredients = db.ingredients.map(i => ({ ...i }))
  const movements: StockMovement[] = [...db.movements]
  for (const item of items) {
    const p = db.products.find(x => x.id === item.productId)
    if (!p) continue
    for (const line of p.recipe) {
      const ing = ingredients.find(x => x.id === line.ingredientId)
      if (!ing) continue
      const used = Math.round(line.qty * item.qty * 100) / 100
      ing.qty = Math.max(0, Math.round((ing.qty - used) * 100) / 100)
      movements.unshift({ id: Date.now() + Math.random(), ingredient: ing.name, change: -used, unit: ing.unit, reason: `Order ${item.name}`, at: new Date().toISOString() })
    }
  }
  return { ...db, ingredients, movements: movements.slice(0, 200) }
}

export function nextOrderNumber(db: DB) {
  const nums = db.orders.map(o => parseInt(o.number.replace('UB-', ''), 10)).filter(n => !isNaN(n))
  return `UB-${(nums.length ? Math.max(...nums) : 1000) + 1}`
}

export const KITCHEN_FLOW = ['new', 'accepted', 'preparing', 'ready', 'served', 'completed'] as const

export function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export type { OrderType }
