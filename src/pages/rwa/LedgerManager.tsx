import React, { useState } from 'react'
import { useAuth } from '../../providers/AuthProvider'
import { restPost } from '../../api/supabaseClient'
import { uploadDocument } from '../../utils/upload'
import {
  classifyExpense,
  submitExpense,
  type ExpenseCategory
} from '../../lib/expenseApproval'
import { ui } from '../../lib/ui'

type Props = {
  embedded?: boolean
}

export default function LedgerManager({ embedded = false }: Props) {
  const { currentSocietyId, user } = useAuth()
  const [type, setType] = useState<'credit' | 'debit'>('credit')
  const [amount, setAmount] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | 'auto'>('auto')
  const [file, setFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState('')

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!currentSocietyId) return alert('Select a society')
    if (!amount || Number(amount) <= 0) return alert('Amount must be > 0')
    if (!description) return alert('Description required')

    let invoice_url: string | undefined
    if (file) invoice_url = await uploadDocument(file)

    const resolvedCategory = category === 'auto' ? classifyExpense(description) : category
    const expense = submitExpense(currentSocietyId, {
      type,
      amount: Number(amount),
      description,
      category: resolvedCategory,
      invoiceUrl: invoice_url ?? null,
      submittedBy: user?.email ?? undefined
    })

    if (expense.category === 'fixed' || expense.status === 'auto_posted') {
      await restPost('society_ledger', {
        society_id: currentSocietyId,
        date: new Date().toISOString(),
        type,
        amount: Number(amount),
        description,
        invoice_url
      })
      setFeedback('Fixed expense posted to cashbook automatically.')
    } else {
      setFeedback('Incidental expense submitted — pending accountant approval before cashbook posting.')
    }

    setAmount('')
    setDescription('')
    setFile(null)
    setCategory('auto')
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
          placeholder="Description (e.g. Guard Salary, Elevator Repair)"
          className={ui.input}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ExpenseCategory | 'auto')}
          className={ui.input}
        >
          <option value="auto">Auto-detect expense type</option>
          <option value="fixed">Fixed / recurring (auto-post)</option>
          <option value="incidental">Incidental / custom (requires approval)</option>
        </select>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={ui.input} />
        {feedback ? <p className="text-sm text-syncra-blue">{feedback}</p> : null}
        <div className="flex justify-end pt-1">
          <button type="submit" className={ui.btnPrimary}>
            Add Entry
          </button>
        </div>
      </form>
    </div>
  )
}
