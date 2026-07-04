import React, { useEffect, useState } from 'react'
import { ui } from '../../lib/ui'
import { usePlatformConfig } from '../../providers/PlatformConfigProvider'
import {
  SIDEBAR_MODULE_LABELS,
  type SidebarModuleKey
} from '../../types/platformConfig'

const saveBtn =
  'w-full rounded-xl bg-syncra-blue py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0047b3]'

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-slate-200 bg-syncra-surface-alt px-4 py-3 transition hover:border-syncra-accent/30">
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-syncra-blue focus:ring-syncra-accent/30"
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className={`mb-2 block ${ui.label}`}>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={ui.input}
      />
    </label>
  )
}

export default function MasterSystemConfig() {
  const { config, updateConfig, setSidebarModule, supabaseSynced } = usePlatformConfig()
  const [status, setStatus] = useState('')
  const [positionTemplatesText, setPositionTemplatesText] = useState(
    config.electionModule.defaultPositionTemplates.join('\n')
  )

  useEffect(() => {
    setPositionTemplatesText(config.electionModule.defaultPositionTemplates.join('\n'))
  }, [config.electionModule.defaultPositionTemplates])

  function handleSave(event: React.FormEvent) {
    event.preventDefault()

    const templates = positionTemplatesText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    updateConfig({
      electionModule: {
        ...config.electionModule,
        defaultPositionTemplates: templates.length > 0 ? templates : config.electionModule.defaultPositionTemplates
      }
    })

    setStatus('Master system configuration saved — sidebar and modules update instantly.')
    window.setTimeout(() => setStatus(''), 4000)
  }

  const sidebarKeys = Object.keys(SIDEBAR_MODULE_LABELS) as SidebarModuleKey[]

  return (
    <div className={`flex flex-col ${ui.card}`}>
      <div>
        <p className={ui.eyebrow}>MaiRide-Style Master Control Plane</p>
        <h3 className={`mt-4 ${ui.heading}`}>Global Platform Settings</h3>
        <p className={`mt-3 ${ui.body}`}>
          Toggle sidebar modules and govern survey/election engines platform-wide. Stored in localStorage with
          optional Supabase sync — no Next.js server route required.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Storage: local · Supabase mirror: {supabaseSynced ? 'synced' : 'local-only fallback'}
        </p>
      </div>

      <form onSubmit={handleSave} className="mt-6 flex flex-1 flex-col gap-6">
        <section className="space-y-3">
          <h4 className="text-sm font-semibold text-syncra-primary">Sidebar Module Toggles</h4>
          <p className="text-xs text-slate-500">Disabled modules disappear from resident and RWA navigation immediately.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {sidebarKeys.map((key) => {
              const meta = SIDEBAR_MODULE_LABELS[key]
              return (
                <ToggleRow
                  key={key}
                  label={meta.label}
                  description={`${meta.description} · ${meta.scope}`}
                  checked={config.sidebarModules[key]}
                  onChange={(enabled) => setSidebarModule(key, enabled)}
                />
              )
            })}
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-syncra-surface-alt p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-syncra-primary">Survey Engine</h4>
              <p className="text-xs text-slate-500">Multi-question survey limits and defaults.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={config.surveyEngine.enabled}
                onChange={(event) =>
                  updateConfig({ surveyEngine: { ...config.surveyEngine, enabled: event.target.checked } })
                }
                className="h-4 w-4 rounded border-slate-300 text-syncra-blue"
              />
              Module enabled
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Max questions per survey"
              value={config.surveyEngine.maxQuestionsPerSurvey}
              min={1}
              max={50}
              onChange={(maxQuestionsPerSurvey) =>
                updateConfig({ surveyEngine: { ...config.surveyEngine, maxQuestionsPerSurvey } })
              }
            />
            <NumberField
              label="Max options per question"
              value={config.surveyEngine.maxOptionsPerQuestion}
              min={2}
              max={20}
              onChange={(maxOptionsPerQuestion) =>
                updateConfig({ surveyEngine: { ...config.surveyEngine, maxOptionsPerQuestion } })
              }
            />
            <NumberField
              label="Default closing window (days)"
              value={config.surveyEngine.defaultClosingDays}
              min={1}
              max={90}
              onChange={(defaultClosingDays) =>
                updateConfig({ surveyEngine: { ...config.surveyEngine, defaultClosingDays } })
              }
            />
          </div>
          <ToggleRow
            label="Allow multiple responses per flat"
            description="When off, each flat may respond once per survey"
            checked={config.surveyEngine.allowMultipleResponses}
            onChange={(allowMultipleResponses) =>
              updateConfig({ surveyEngine: { ...config.surveyEngine, allowMultipleResponses } })
            }
          />
        </section>

        <section className="space-y-3 rounded-xl border border-slate-200 bg-syncra-surface-alt p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-syncra-primary">Election Module</h4>
              <p className="text-xs text-slate-500">Dynamic resident election positions and ballot limits.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={config.electionModule.enabled}
                onChange={(event) =>
                  updateConfig({ electionModule: { ...config.electionModule, enabled: event.target.checked } })
                }
                className="h-4 w-4 rounded border-slate-300 text-syncra-blue"
              />
              Module enabled
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Max positions per election"
              value={config.electionModule.maxPositionsPerElection}
              min={1}
              max={20}
              onChange={(maxPositionsPerElection) =>
                updateConfig({ electionModule: { ...config.electionModule, maxPositionsPerElection } })
              }
            />
            <NumberField
              label="Max candidates per position"
              value={config.electionModule.maxCandidatesPerPosition}
              min={2}
              max={30}
              onChange={(maxCandidatesPerPosition) =>
                updateConfig({ electionModule: { ...config.electionModule, maxCandidatesPerPosition } })
              }
            />
          </div>
          <ToggleRow
            label="Anonymous encrypted voting"
            description="Seal ballots with Web Crypto — no plaintext vote storage"
            checked={config.electionModule.allowAnonymousVoting}
            onChange={(allowAnonymousVoting) =>
              updateConfig({ electionModule: { ...config.electionModule, allowAnonymousVoting } })
            }
          />
          <label className="block">
            <span className={`mb-2 block ${ui.label}`}>Default position templates (one per line)</span>
            <textarea
              rows={4}
              value={positionTemplatesText}
              onChange={(event) => setPositionTemplatesText(event.target.value)}
              className={ui.input}
              placeholder={'President\nSecretary\nTreasurer'}
            />
          </label>
        </section>

        <button type="submit" className={saveBtn}>
          Save Master System Config
        </button>
        {status && <p className={ui.body}>{status}</p>}
      </form>
    </div>
  )
}
