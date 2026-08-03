import React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

type SwitchProps = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

export default function Switch({ checked, onCheckedChange, disabled, id, ...rest }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border border-slate-200 bg-slate-200 outline-none transition data-[state=checked]:border-syncra-blue data-[state=checked]:bg-syncra-blue disabled:cursor-not-allowed disabled:opacity-50"
      {...rest}
    >
      <SwitchPrimitive.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform duration-150 will-change-transform data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  )
}
