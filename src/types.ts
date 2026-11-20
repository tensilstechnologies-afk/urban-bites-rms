export type Role =
  | 'super_admin' | 'owner' | 'admin' | 'manager' | 'cashier'
  | 'waiter' | 'chef' | 'kitchen' | 'inventory' | 'accountant'

export interface User {
  id: number; name: string; email: string; role: Role; roleLabel: string
  phone: string; salary: number; active: boolean; joinedAt: string
}

export interface Category { id: number; name: string; image: string }
export interface Variation { id: number; name: string; delta: number }
export interface RecipeLine { ingredientId: number; qty: number }
export interface Product {
  id: number; name: string; categoryId: number; price: number; costPrice: number
  description: string; image: string; prepMins: number; station: string
  dietary: string; available: boolean; sku: string; featured: boolean
  variations: Variation[]; recipe: RecipeLine[]
}
export interface Modifier { id: number; name: string; group: string; price: number }
export interface Ingredient {
  id: number; name: string; qty: number; unit: string; minLevel: number
  unitCost: number; expiry: string | null
}
export interface OrderItem {
  productId: number; name: string; qty: number; unitPrice: number
  variation: string; modifiers: string; notes: string
}
export type OrderType = 'dine_in' | 'takeaway' | 'delivery' | 'pickup' | 'online'
export type KitchenStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed'
export interface Payment { method: string; amount: number; at: string }
export interface Order {
  id: number; number: string; type: OrderType; status: 'pending' | 'completed' | 'cancelled' | 'held'
  kitchenStatus: KitchenStatus; customerId: number | null; customerName: string
  waiterName: string; tableLabel: string | null; items: OrderItem[]
  subtotal: number; discount: number; tax: number; serviceCharge: number; deliveryFee: number
  total: number; paidAmount: number; paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded'
  payments: Payment[]; createdAt: string; notes: string; cancelReason: string; source: 'pos' | 'online'
}
export interface Table {
  id: number; label: string; floor: string; capacity: number
  status: 'available' | 'occupied' | 'reserved' | 'waiting_food' | 'served' | 'payment_pending' | 'cleaning'
  waiterId: number | null; x: number; y: number
}
export interface Customer {
  id: number; name: string; phone: string; email: string; points: number; segment: string; notes: string
}
export interface Supplier { id: number; name: string; contact: string; phone: string; email: string; balance: number }
export interface Purchase { id: number; supplierId: number; supplierName: string; items: string; total: number; paid: number; date: string; status: string }
export interface Expense { id: number; category: string; description: string; amount: number; method: string; date: string }
export interface StockMovement { id: number; ingredient: string; change: number; unit: string; reason: string; at: string }
export interface Notification { id: number; text: string; kind: string; read: boolean; at: string }
export interface AuditEntry { id: number; actor: string; action: string; at: string }
export interface Reservation { id: number; customer: string; tableLabel: string; date: string; time: string; guests: number; status: string }
export interface Settings {
  name: string; tagline: string; address: string; phone: string; email: string
  hours: string; currency: string; taxRate: number; serviceRate: number; deliveryFee: number
  loyaltyPer1000: number; loyaltyValue: number
}
export interface Attendance { userId: number; name: string; date: string; in: string | null; out: string | null }
