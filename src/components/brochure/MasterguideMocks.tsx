/**
 * Visual mock widgets for the 18-page Masterguide — print-safe inline CSS.
 */
import React from 'react'

const NAVY = '#0f172a'
const BLUE = '#2563eb'
const SLATE = '#f1f5f9'
const EMERALD = '#059669'

export function DeliveryInterceptorMock() {
  return (
    <div
      className="master-mock"
      style={{ background: SLATE, border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: BLUE }}>
          Universal Delivery Interceptor
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: '#fff',
            background: EMERALD,
            borderRadius: 999,
            padding: '3px 8px'
          }}
        >
          PRE-CLEARED
        </span>
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: 10, borderBottom: 8 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: NAVY }}>Amazon · Expected 18:40</p>
        <p style={{ margin: '4px 0 0', fontSize: 10, color: '#64748b' }}>Flat B-402 · OTP matched via SMS listener</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {['Swiggy', 'India Post', 'Zomato'].map((label) => (
          <div
            key={label}
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '6px 4px',
              textAlign: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: NAVY,
              border: '1px solid #e2e8f0'
            }}
          >
            {label}
            <div style={{ color: EMERALD, marginTop: 2, fontSize: 8 }}>✓ Clear</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuditorAnomalyMock() {
  const bars = [
    { label: 'Jan', h: 42 },
    { label: 'Feb', h: 48 },
    { label: 'Mar', h: 45 },
    { label: 'Apr', h: 70, flag: true },
    { label: 'May', h: 44 }
  ]
  return (
    <div className="master-mock" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: BLUE }}>
            mAI Auditor
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 800, color: NAVY }}>Water pump expense</p>
        </div>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: '#fff',
            background: '#dc2626',
            borderRadius: 8,
            padding: '4px 8px'
          }}
        >
          −20% MoM flag
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72, marginTop: 12 }}>
        {bars.map((b) => (
          <div key={b.label} style={{ flex: 1, textAlign: 'center' }}>
            <div
              style={{
                height: b.h,
                borderRadius: '6px 6px 2px 2px',
                background: b.flag ? '#f87171' : BLUE,
                marginBottom: 4
              }}
            />
            <span style={{ fontSize: 8, fontWeight: 700, color: '#64748b' }}>{b.label}</span>
          </div>
        ))}
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 10, color: '#475569', lineHeight: 1.4 }}>
        Hold payment · dual-signatory review recommended before vendor release.
      </p>
    </div>
  )
}

export function ParkingEarningsMock() {
  return (
    <div
      className="master-mock"
      style={{
        background: `linear-gradient(135deg, ${NAVY}, ${BLUE})`,
        borderRadius: 12,
        padding: 12,
        color: '#fff'
      }}
    >
      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: '#bfdbfe' }}>
        Monetized parking · Flat A-101
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 900 }}>₹180</p>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#dbeafe' }}>Today · 9 hrs @ ₹20/hr · UPI credited</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
        {[
          ['Guest', 'Visitor MH-02'],
          ['Window', '09:00–18:00'],
          ['Vacate', '−30 min alert'],
          ['Wallet', '₹4,260 LTD']
        ].map(([k, v]) => (
          <div key={k} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 8px' }}>
            <div style={{ fontSize: 8, color: '#93c5fd' }}>{k}</div>
            <div style={{ fontSize: 10, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MaiListPipelineMock() {
  const steps = ['maiSociety', 'Major portals', 'Housing sites', 'Zero-brokerage']
  return (
    <div className="master-mock" style={{ background: SLATE, border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <p style={{ margin: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', color: BLUE }}>
        maiList syndication pipeline
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div
              style={{
                background: i === 0 ? NAVY : '#fff',
                color: i === 0 ? '#fff' : NAVY,
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '7px 8px',
                fontSize: 9,
                fontWeight: 800,
                flex: '1 1 auto',
                textAlign: 'center',
                minWidth: 64
              }}
            >
              {s}
            </div>
            {i < steps.length - 1 ? (
              <span style={{ color: BLUE, fontWeight: 900, fontSize: 12 }}>→</span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 10, color: '#475569', lineHeight: 1.4 }}>
        Publish once · fan-out payloads · Verified Society badge when dues + NOC clear.
      </p>
    </div>
  )
}

export function ArchitectureFlowMock() {
  const nodes = [
    ['Edge Functions', 'Jobs · webhooks'],
    ['Supabase RLS', 'Per-society isolation'],
    ['Realtime WS', 'Gate · SOS · notices'],
    ['Telephony', 'Encrypted WA / SMS']
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {nodes.map(([t, d]) => (
        <div
          key={t}
          style={{
            borderLeft: `4px solid ${BLUE}`,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderLeftWidth: 4,
            borderLeftColor: BLUE,
            borderRadius: 8,
            padding: '8px 10px'
          }}
        >
          <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: NAVY }}>{t}</p>
          <p style={{ margin: '3px 0 0', fontSize: 10, color: '#64748b' }}>{d}</p>
        </div>
      ))}
    </div>
  )
}
