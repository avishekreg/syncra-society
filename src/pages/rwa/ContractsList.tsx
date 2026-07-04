import React, { useEffect, useState } from 'react'
import { MaintenanceContract } from '../../types/db'
import { listContracts, createContract, deleteContract } from '../../api/contracts'
import { useAuth } from '../../providers/AuthProvider'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ui } from '../../lib/ui'

type Props = {
  embedded?: boolean
}

export default function ContractsList({ embedded = false }: Props) {
  const [contracts, setContracts] = useState<MaintenanceContract[]>([])
  const [loading, setLoading] = useState(false)
  const [vendor, setVendor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const { currentSocietyId } = useAuth()

  useEffect(() => {
    fetchList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSocietyId])

  async function fetchList() {
    if (!currentSocietyId) return
    setLoading(true)
    try {
      const data = await listContracts(currentSocietyId)
      setContracts(data)
    } finally {
      setLoading(false)
    }
  }

  const contractSchema = z.object({
    vendor_name: z.string().min(1, 'Vendor required'),
    start_date: z.string().min(1, 'Start date required'),
    end_date: z.string().min(1, 'End date required')
  })

  type ContractForm = z.infer<typeof contractSchema>

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContractForm>({
    resolver: zodResolver(contractSchema)
  })

  async function handleCreate(values: ContractForm) {
    if (!currentSocietyId) return alert('Select society')
    if (new Date(values.start_date) > new Date(values.end_date)) return alert('Start date must be before end date')
    await createContract(
      {
        society_id: currentSocietyId,
        vendor_name: values.vendor_name,
        start_date: values.start_date,
        end_date: values.end_date
      },
      file ?? undefined
    )
    reset()
    setFile(null)
    fetchList()
  }

  async function handleDelete(id?: string) {
    if (!id) return
    await deleteContract(id)
    fetchList()
  }

  return (
    <div className="flex h-full flex-col">
      {!embedded && <h2 className={`mb-4 ${ui.heading}`}>Maintenance Contracts</h2>}

      <form onSubmit={handleSubmit(handleCreate)} className="mb-4 space-y-3">
        <input
          {...register('vendor_name')}
          defaultValue={vendor}
          onChange={(e) => setVendor(e.target.value)}
          placeholder="Vendor name"
          className={ui.input}
        />
        {errors.vendor_name && <p className="text-xs text-syncra-action-alt">{errors.vendor_name.message}</p>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <input type="date" {...register('start_date')} className={ui.input} />
            {errors.start_date && <p className="mt-1 text-xs text-syncra-action-alt">{errors.start_date.message}</p>}
          </div>
          <div>
            <input type="date" {...register('end_date')} className={ui.input} />
            {errors.end_date && <p className="mt-1 text-xs text-syncra-action-alt">{errors.end_date.message}</p>}
          </div>
        </div>

        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={ui.input} />

        <div className="flex justify-end">
          <button type="submit" className={ui.btnPrimary}>
            Create
          </button>
        </div>
      </form>

      {loading ? (
        <p className={ui.body}>Loading...</p>
      ) : (
        <ul className="space-y-2">
          {contracts.map((c) => (
            <li key={c.id} className={`flex items-center justify-between gap-3 ${ui.innerItem}`}>
              <div className="min-w-0">
                <div className="truncate font-medium text-syncra-primary">{c.vendor_name}</div>
                <div className="text-xs text-slate-500">
                  {c.start_date} → {c.end_date}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {c.document_url && (
                  <a
                    href={c.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-syncra-blue hover:text-syncra-accent"
                  >
                    Doc
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="text-xs text-syncra-action-alt hover:text-[#e04545]"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
