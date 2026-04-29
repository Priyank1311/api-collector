import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  const sizes = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'
  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
    ghost: 'text-slate-700 hover:bg-slate-100',
  }

  return <button className={[base, sizes, variants[variant], className].join(' ')} {...props} />
}

