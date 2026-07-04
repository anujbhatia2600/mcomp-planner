import { useRef, useState } from 'react'
import { SEED_PLANS } from '../data/courses.js'

export default function DataTab({ store, setStore }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mcomp-plans-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('Exported. Keep the file somewhere safe — it contains all plans and timing edits.')
  }

  const importJson = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.plans || !data.activePlanId) throw new Error('Not a planner export file.')
        setStore(data)
        setMsg('Imported. Your plans and timing edits are restored.')
      } catch (e) {
        setMsg('Import failed: ' + e.message)
      }
    }
    reader.readAsText(file)
  }

  const resetAll = () => {
    if (!confirm('Reset everything to the three seed plans and built-in timings? Your current plans will be lost unless exported.')) return
    setStore({
      plans: structuredClone(SEED_PLANS),
      activePlanId: SEED_PLANS[0].id,
      courseOverrides: {},
    })
    setMsg('Reset to seed plans.')
  }

  return (
    <div className="panel">
      <h2>Your data</h2>
      <p className="dim">
        Everything lives in this browser's localStorage on your laptop — nothing is uploaded
        anywhere. Export a JSON backup before clearing browser data or switching machines.
      </p>
      <div className="data-actions">
        <button className="btn primary" onClick={exportJson}>
          Export backup (.json)
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => e.target.files[0] && importJson(e.target.files[0])}
        />
        <button className="btn warn" onClick={resetAll}>
          Reset to seed plans
        </button>
      </div>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}

      <h2 style={{ marginTop: 24 }}>Current store (read-only view)</h2>
      <textarea className="jsonbox" readOnly value={JSON.stringify(store, null, 2)} />
    </div>
  )
}
