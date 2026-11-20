import { useState, type ReactNode } from 'react'
import { FALLBACK_IMG } from './data'

export function FoodImg({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [s, setS] = useState(src)
  return <img src={s} alt={alt} loading="lazy" onError={() => { if (s !== FALLBACK_IMG) setS(FALLBACK_IMG) }} className={className} />
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 anim-fade-in" style={{ background: 'rgba(0,0,0,.55)' }} onClick={onClose}>
      <div className={`card anim-pop w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto p-5`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button className="btn btn-ghost !px-3" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="card card-hover p-4 anim-fade-up">
      <div className="label">{label}</div>
      <div className="text-2xl font-extrabold mt-1" style={accent ? { color: 'var(--accent)' } : undefined}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}

export function BarChart({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map(d => d.value))
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
          <span className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{d.value.toLocaleString()}</span>
          <div className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80" style={{ height: `${Math.max(4, (d.value / max) * 78)}%`, background: 'linear-gradient(180deg, var(--accent), var(--accent2))' }} title={`${d.label}: ${d.value.toLocaleString()}`} />
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    available: '#15803d', occupied: '#b91c1c', reserved: '#b45309', waiting_food: '#92400e',
    served: '#15803d', payment_pending: '#b45309', cleaning: '#6b7280',
    new: '#b91c1c', accepted: '#b45309', preparing: '#92400e', ready: '#15803d',
    completed: '#15803d', pending: '#b45309', cancelled: '#b91c1c', paid: '#15803d',
    unpaid: '#b91c1c', partial: '#b45309', refunded: '#6b7280', held: '#6b7280',
  }
  const color = map[status] || '#6b7280'
  return <span className="chip" style={{ background: `${color}1e`, color }}>{status.replace(/_/g, ' ')}</span>
}

export function Empty({ text }: { text: string }) {
  return <div className="card p-8 text-center anim-fade-in" style={{ color: 'var(--muted)' }}>{text}</div>
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return <input className="input" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
}
