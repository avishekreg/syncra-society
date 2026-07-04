import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { restPost } from '../../api/supabaseClient'
import { uploadDocument } from '../../utils/upload'
import { ui } from '../../lib/ui'

type Props = {
  embedded?: boolean
}

export default function LedgerManager({ embedded = false }: Props) {
  const { currentSocietyId } = useAuth()
  const [type, setType] = useState<'credit' | 'debit'>('credit')
  const [amount, setAmount] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId) return alert('Select a society')
    if (!amount || Number(amount) <= 0) return alert('Amount must be > 0')
    if (!description) return alert('Description required')

    let invoice_url: string | undefined
    if (file) invoice_url = await uploadDocument(file)

    await restPost('society_ledger', {
      society_id: currentSocietyId,
      date: new Date().toISOString(),
      type,
      amount: Number(amount),
      description,
      invoice_url
    })

    setAmount('')
    setDescription('')
    setFile(null)
    alert('Ledger entry added')
  }

  return (
    <div>
      {!embedded && <h2 className={`mb-4 ${ui.heading}`}>Add Ledger Entry</h2>}
      <form onSubmit={handleAdd} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select value={type} onChange={(e) => setType(e.target.value as 'credit' | 'debit')} className={ui.input}>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Amount"
            type="number"
            className={ui.input}
          />
        </div>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className={ui.input}
        />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={ui.input} />
        <div className="flex justify-end pt-1">
          <button type="submit" className={ui.btnPrimary}>
            Add Entry
          </button>
        </div>
      </form>
    </div>
  )
}
