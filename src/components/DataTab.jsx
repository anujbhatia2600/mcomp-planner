import { useRef, useState } from 'react'
import { SEED_PLANS, COURSES } from '../data/courses.js'
import { TOKEN_KEY, createGist, pullGist } from '../lib/sync.js'
import { syncAllCourses } from '../lib/nusmodsSync.js'

export default function DataTab({ store, setStore, adoptRemote, sync, doPull }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || '')
  const [gistIdInput, setGistIdInput] = useState(store.sync?.gistId || '')
  const [busy, setBusy] = useState(false)
  const connected = !!(localStorage.getItem(TOKEN_KEY) && store.sync?.gistId)

  const [acadYear, setAcadYear] = useState('2026-2027')
  const [refreshing, setRefreshing] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [report, setReport] = useState(null)

  const runRefresh = async () => {
    setRefreshing(true)
    setReport(null)
    setProgress({ done: 0, total: 0 })
    const currentOfferingsByCode = Object.fromEntries(
      COURSES.map((c) => [
        c.code,
        store.courseOverrides[c.code]?.offerings || c.offerings,
      ])
    )
    try {
      const result = await syncAllCourses(COURSES, acadYear, currentOfferingsByCode, (done, total) =>
        setProgress({ done, total })
      )
      setReport(result)
    } catch (e) {
      setReport({ updates: [], unchanged: [], notFound: [], errors: [{ code: 'ALL', message: e.message }] })
    }
    setRefreshing(false)
  }

  const applyUpdate = (u) => {
    setStore((s) => ({
      ...s,
      courseOverrides: {
        ...s.courseOverrides,
        [u.code]: {
          ...(s.courseOverrides[u.code] || {}),
          offerings: u.after,
          evening: u.after.some((o) => Number(o.start.split(':')[0]) >= 18),
        },
      },
    }))
    setReport((r) => ({ ...r, updates: r.updates.filter((x) => x.code !== u.code) }))
  }

  const applyAllUpdates = () => {
    if (!report?.updates?.length) return
    setStore((s) => {
      const next = { ...s.courseOverrides }
      for (const u of report.updates) {
        next[u.code] = {
          ...(next[u.code] || {}),
          offerings: u.after,
          evening: u.after.some((o) => Number(o.start.split(':')[0]) >= 18),
        }
      }
      return { ...s, courseOverrides: next }
    })
    setReport((r) => ({ ...r, updates: [] }))
  }

  // ── sync actions ──
  const saveToken = () => {
    localStorage.setItem(TOKEN_KEY, token.trim())
    setMsg('Token saved on this device.')
  }

  const connectNew = async () => {
    if (!token.trim()) return setMsg('Paste a GitHub token first.')
    localStorage.setItem(TOKEN_KEY, token.trim())
    setBusy(true)
    try {
      const gistId = await createGist(token.trim(), { ...store, sync: undefined })
      setStore((s) => ({ ...s, sync: { gistId } }))
      setGistIdInput(gistId)
      setMsg(`Connected. Created private gist ${gistId}. On your iPhone, paste the same token AND this Gist ID, then "Connect to existing gist".`)
    } catch (e) {
      setMsg(e.message)
    }
    setBusy(false)
  }

  const connectExisting = async () => {
    if (!token.trim() || !gistIdInput.trim()) return setMsg('Need both the token and the Gist ID.')
    localStorage.setItem(TOKEN_KEY, token.trim())
    setBusy(true)
    try {
      const remote = await pullGist(token.trim(), gistIdInput.trim())
      adoptRemote(remote, gistIdInput.trim())
      setMsg('Connected — pulled the latest data from the gist.')
    } catch (e) {
      setMsg(e.message)
    }
    setBusy(false)
  }

  const disconnect = () => {
    localStorage.removeItem(TOKEN_KEY)
    setStore((s) => ({ ...s, sync: { gistId: null } }))
    setToken('')
    setMsg('Disconnected. Data stays on this device; the gist is untouched.')
  }

  // ── backup actions ──
  const exportJson = () => {
    const { sync: _omit, ...rest } = store // gist id is harmless but keep backups clean
    const blob = new Blob([JSON.stringify(rest, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `mcomp-plans-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg('Exported. The backup never contains your GitHub token.')
  }

  const importJson = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data.plans || !data.activePlanId) throw new Error('Not a planner export file.')
        setStore((s) => ({ ...s, ...data, sync: s.sync })) // keep current sync connection
        setMsg('Imported. Your plans and timing edits are restored.')
      } catch (e) {
        setMsg('Import failed: ' + e.message)
      }
    }
    reader.readAsText(file)
  }

  const resetAll = () => {
    if (!confirm('Reset everything to the three seed plans and built-in timings? Your current plans will be lost unless exported.')) return
    setStore((s) => ({
      plans: structuredClone(SEED_PLANS),
      activePlanId: SEED_PLANS[0].id,
      courseOverrides: {},
      sync: s.sync, // stay connected; reset will sync out like any other edit
    }))
    setMsg('Reset to seed plans.')
  }

  return (
    <>
      <div className="panel">
        <h2>Refresh course timings from NUSMods (live)</h2>
        <p className="dim">
          Pulls the real, current timetable for every course straight from the{' '}
          <a href="https://api.nusmods.com/v2/" target="_blank" rel="noreferrer">
            NUSMods API ↗
          </a>{' '}
          — this runs in your browser, not a cached snapshot, so it's always up to date
          (including once AY2026/27 timings are finalised before CourseReg Round 1).
        </p>
        <div className="sync-form">
          <label>
            Academic year
            <select value={acadYear} onChange={(e) => setAcadYear(e.target.value)}>
              <option value="2026-2027">AY2026/2027 (current)</option>
              <option value="2025-2026">AY2025/2026 (fallback / comparison)</option>
            </select>
          </label>
        </div>
        <div className="data-actions">
          <button className="btn primary" onClick={runRefresh} disabled={refreshing}>
            {refreshing ? `Checking… ${progress.done}/${progress.total}` : 'Refresh all timings'}
          </button>
        </div>

        {report && (
          <div style={{ marginTop: 16 }}>
            <p className="dim">
              {report.updates.length} changed · {report.unchanged.length} unchanged ·{' '}
              {report.notFound.length} not offered / no data · {report.errors.length} errors
            </p>

            {report.updates.length > 0 && (
              <>
                <div className="data-actions">
                  <button className="btn primary" onClick={applyAllUpdates}>
                    Apply all {report.updates.length} updates
                  </button>
                </div>
                {report.updates.map((u) => (
                  <div key={u.code} className="audit-item warn">
                    <span className="dot" />
                    <span>
                      <b className="mono">{u.code}</b> — was{' '}
                      {u.before.length
                        ? u.before.map((o, i) => (
                            <span key={i} className="mono">
                              {i > 0 && ', '}S{o.sem} {o.day} {o.start}
                            </span>
                          ))
                        : 'unset'}
                      {' → '}
                      {u.after.map((o, i) => (
                        <span key={i} className="mono">
                          {i > 0 && ', '}S{o.sem} {o.day} {o.start}–{o.end}
                          {o.venue ? ` (${o.venue})` : ''}
                        </span>
                      ))}
                      <button className="btn" style={{ marginLeft: 8 }} onClick={() => applyUpdate(u)}>
                        Apply
                      </button>
                    </span>
                  </div>
                ))}
              </>
            )}

            {report.notFound.length > 0 && (
              <p className="dim" style={{ marginTop: 10 }}>
                Not found / no lessons this year: {report.notFound.map((n) => n.code).join(', ')}
                {' — '}check manually via the course drawer, it may not run in {acadYear}.
              </p>
            )}
            {report.errors.length > 0 && (
              <p style={{ color: 'var(--err)', marginTop: 10 }}>
                Errors: {report.errors.map((e) => `${e.code} (${e.message})`).join('; ')}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Sync across devices (GitHub Gist)</h2>
        <p className="dim">
          Your plans sync through a <b>private gist</b> on your GitHub account — changes push
          automatically ~1.5s after you stop editing, and every device pulls on launch
          (last-write-wins). Create a{' '}
          <a href="https://github.com/settings/tokens/new?scopes=gist&description=MComp%20Planner%20sync" target="_blank" rel="noreferrer">
            classic token with only the "gist" scope ↗
          </a>{' '}
          (or a fine-grained token with Gists read/write). The token is stored only in this
          browser and never leaves your devices except to call api.github.com.
        </p>

        <div className="sync-form">
          <label>
            GitHub token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_… or github_pat_…"
              autoComplete="off"
            />
          </label>
          <label>
            Gist ID
            <input
              value={gistIdInput}
              onChange={(e) => setGistIdInput(e.target.value)}
              placeholder="created automatically, or paste from your other device"
            />
          </label>
        </div>

        <div className="data-actions">
          {!connected && (
            <>
              <button className="btn primary" onClick={connectNew} disabled={busy}>
                Connect · create new gist
              </button>
              <button className="btn" onClick={connectExisting} disabled={busy}>
                Connect to existing gist
              </button>
            </>
          )}
          {connected && (
            <>
              <button className="btn primary" onClick={doPull} disabled={busy}>
                Sync now
              </button>
              <button className="btn" onClick={saveToken}>
                Update token
              </button>
              <button className="btn warn" onClick={disconnect}>
                Disconnect this device
              </button>
            </>
          )}
        </div>
        {connected && (
          <p className="dim" style={{ marginTop: 10 }}>
            Status: <b>{sync.status}</b>
            {sync.lastSynced && <> · last synced {sync.lastSynced.toLocaleTimeString()}</>}
            {sync.error && <span style={{ color: 'var(--err)' }}> · {sync.error}</span>}
            <br />
            Gist ID: <span className="mono">{store.sync.gistId}</span> — paste this on your
            iPhone together with the same token.
          </p>
        )}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h2>Backups</h2>
        <p className="dim">
          Independent of sync — a file backup you keep yourself. Never includes your token.
        </p>
        <div className="data-actions">
          <button className="btn" onClick={exportJson}>
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
      </div>
    </>
  )
}
