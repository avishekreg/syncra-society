import React, { useState, useEffect } from 'react'
import supabase from '../api/supabaseSdk'

const DOORBELL_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'

function readFlatNumber(row) {
  return row?.flat_no ?? row?.target_flat_number ?? ''
}

function isPendingStatus(status) {
  return status === 'pending' || status === 'pending_approval'
}

function readTimestamp(row) {
  const raw = row?.created_at ?? row?.requested_at
  return raw ? new Date(raw).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''
}

const GatekeeperAlert = ({ societyId, myFlatNo }) => {
  const [currentVisitor, setCurrentVisitor] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!societyId || !myFlatNo) return

    const visitorSubscription = supabase
      .channel(`gatekeeper-alerts-${societyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'visitor_logs',
          filter: `society_id=eq.${societyId}`
        },
        (payload) => {
          const row = payload.new
          const flatNo = readFlatNumber(row)

          if (flatNo === myFlatNo && isPendingStatus(row.status)) {
            setCurrentVisitor(row)

            try {
              const bell = new Audio(DOORBELL_URL)
              bell.play().catch((audioError) => {
                console.error('Audio playback blocked or failed:', audioError)
              })
            } catch (audioError) {
              console.error('Audio playback blocked or failed:', audioError)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(visitorSubscription)
    }
  }, [societyId, myFlatNo])

  const handleAction = async (statusValue) => {
    if (!currentVisitor) return
    setLoading(true)

    try {
      const { error } = await supabase
        .from('visitor_logs')
        .update({ status: statusValue, actioned_at: new Date().toISOString() })
        .eq('id', currentVisitor.id)

      if (error) throw error

      setCurrentVisitor(null)
    } catch (err) {
      console.error('Error updating visitor status:', err?.message ?? err)
    } finally {
      setLoading(false)
    }
  }

  if (!currentVisitor) return null

  const displayFlat = readFlatNumber(currentVisitor)

  return (
    <div
      role="alertdialog"
      aria-labelledby="gatekeeper-alert-title"
      aria-describedby="gatekeeper-alert-desc"
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: '#fff',
        border: '2px solid #00c853',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        padding: '20px',
        zIndex: 1000,
        width: 'min(320px, calc(100vw - 40px))',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <span style={{ fontSize: '30px' }} aria-hidden="true">
          🔔
        </span>
        <h3 id="gatekeeper-alert-title" style={{ margin: '10px 0 5px 0', color: '#333' }}>
          Gatekeeper Alert!
        </h3>
        <p id="gatekeeper-alert-desc" style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Someone is at the main gate
        </p>
      </div>

      <div
        style={{
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '15px'
        }}
      >
        <p style={{ margin: '4px 0', fontSize: '15px' }}>
          <strong>Visitor:</strong> {currentVisitor.visitor_name}
        </p>
        <p style={{ margin: '4px 0', fontSize: '15px' }}>
          <strong>Flat No:</strong> {displayFlat}
        </p>
        {currentVisitor.purpose && (
          <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>
            <strong>Purpose:</strong> {currentVisitor.purpose}
          </p>
        )}
        <p style={{ margin: '4px 0', fontSize: '12px', color: '#888' }}>{readTimestamp(currentVisitor)}</p>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction('approved')}
          style={{
            flex: 1,
            minHeight: '44px',
            padding: '10px',
            backgroundColor: '#00c853',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '...' : 'Approve 🟢'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => handleAction('denied')}
          style={{
            flex: 1,
            minHeight: '44px',
            padding: '10px',
            backgroundColor: '#d50000',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          Deny 🔴
        </button>
      </div>
    </div>
  )
}

export default GatekeeperAlert
