type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-500">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
