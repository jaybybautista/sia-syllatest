import { X } from 'lucide-react'

export const glass =
  'backdrop-blur-[9px] bg-white/70 border border-white/40 shadow-[0_10px_12px_rgba(15,23,42,0.06)]'

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`${glass} rounded-2xl ${className}`} {...rest}>
      {children}
    </div>
  )
}

const buttonStyles = {
  primary: 'bg-brand text-white hover:bg-[#172e6e]',
  accent: 'bg-accent text-white hover:bg-accent-dark shadow-[0_8px_10px_rgba(217,119,6,0.2)]',
  ghost: 'bg-white/70 text-ink-2 border border-line hover:bg-white',
  danger: 'bg-bad text-white hover:bg-red-700',
}

export function Button({ variant = 'primary', icon: Icon, className = '', children, ...rest }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...rest}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

const badgeTones = {
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  bad: 'bg-bad-bg text-bad',
  info: 'bg-brand-soft text-brand',
  muted: 'bg-slate-100 text-ink-2',
}

export function Badge({ tone = 'muted', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function ProgressBar({ value, className = '' }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-[3px] bg-slate-100 ${className}`}>
      <div className="h-full bg-brand transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}

export function Modal({ title, subtitle, icon: Icon, tone, onClose, width = 520, children, footer }) {
  const iconTone = {
    bad: 'bg-bad-bg text-bad',
    warn: 'bg-warn-bg text-warn',
    ok: 'bg-ok-bg text-ok',
    info: 'bg-brand-soft text-brand',
  }[tone ?? 'info']

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex max-h-[90vh] max-w-full flex-col rounded-3xl bg-white shadow-[0_20px_40px_rgba(2,6,23,0.2)]"
        style={{ width }}
      >
        <div className="flex items-start justify-between gap-4 px-8 pt-7">
          <div className="flex items-center gap-4">
            {Icon && (
              <span className={`flex size-12 shrink-0 items-center justify-center rounded-full ${iconTone}`}>
                <Icon size={24} />
              </span>
            )}
            <div>
              <h2 className="text-lg font-bold text-ink">{title}</h2>
              {subtitle && <p className="text-sm text-ink-3">{subtitle}</p>}
            </div>
          </div>
          {onClose && (
            <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-ink-3 hover:bg-slate-100">
              <X size={18} />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-8 py-5 text-sm text-ink-2">{children}</div>
        {footer && <div className="flex justify-end gap-3 px-8 pb-7">{footer}</div>}
      </div>
    </div>
  )
}

export function PageHeading({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-ink-3">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
