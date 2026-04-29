import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & { error?: string }

export function Input({ className = '', error, ...props }: Props) {
  return (
    <div className="grid gap-1.5">
      <input
        className={[
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400',
          'dark:bg-slate-950 dark:text-slate-50 dark:placeholder:text-slate-500',
          error
            ? 'border-rose-300 focus:border-rose-400 dark:border-rose-800 dark:focus:border-rose-600'
            : 'border-slate-200 focus:border-slate-400 dark:border-slate-800 dark:focus:border-slate-600',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? <div className="text-xs font-medium text-rose-700">{error}</div> : null}
    </div>
  )
}
