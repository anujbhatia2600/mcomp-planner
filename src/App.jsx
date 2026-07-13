import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { COURSES, SEED_PLANS, SEMESTERS } from './data/courses.js'
import { TOKEN_KEY, pullGist, pushGist } from './lib/sync.js'
import Planner from './components/Planner.jsx'
import Catalog from './components/Catalog.jsx'
import CourseDrawer from './components/CourseDrawer.jsx'
import DataTab from './components/DataTab.jsx'

const STORE_KEY = 'mcomp-planner-v1'

function defaultStore() {
  return {
    plans: structuredClone(SEED_PLANS),
    activePlanId: SEED_PLANS[0].id,
    courseOverrides: {},
    sync: { gistId: null },
    updatedAt: 0,
  }
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const s = JSON.parse(raw)
      // migrate stores from v1.0 (pre-sync)
      return { ...defaultStore(), ...s, sync: s.sync || { gistId: null }, updatedAt: s.updatedAt || 0 }
    }
  } catch (e) {
    console.error('Could not read saved data:', e)
  }
  return defaultStore()
}

export default function App() {
  const [store, rawSetStore] = useState(loadStore)
  const [tab, setTab] = useState('planner')
  const [drawerCode, setDrawerCode] = useState(null)
  const [sync, setSync] = useState({ status: 'off', lastSynced: null, error: null })
  const skipNextPush = useRef(false)
  const pushTimer = useRef(null)

  // Any user edit bumps updatedAt (drives last-write-wins)
  const setStore = useCallback((arg) => {
    rawSetStore((prev) => {
      const next = typeof arg === 'function' ? arg(prev) : arg
      return { ...next, updatedAt: Date.now() }
    })
  }, [])

  // Adopting the remote copy keeps its own timestamp and must not re-push
  const adoptRemote = useCallback((remote, gistId) => {
    skipNextPush.current = true
    rawSetStore({ ...defaultStore(), ...remote, sync: { gistId } })
  }, [])

  // Persist locally
  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store))
    } catch (e) {
      console.error('Could not save:', e)
    }
  }, [store])

  const doPull = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const gistId = store.sync?.gistId
    if (!token || !gistId) return
    setSync((s) => ({ ...s, status: 'syncing', error: null }))
    try {
      const remote = await pullGist(token, gistId)
      if ((remote.updatedAt || 0) > (store.updatedAt || 0)) {
        adoptRemote(remote, gistId)
      } else if ((store.updatedAt || 0) > (remote.updatedAt || 0)) {
        await pushGist(token, gistId, store)
      }
      setSync({ status: 'synced', lastSynced: new Date(), error: null })
    } catch (e) {
      setSync({ status: 'error', lastSynced: null, error: e.message })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, adoptRemote])

  // Pull once when the app opens (if connected)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token && store.sync?.gistId) doPull()
    else setSync((s) => ({ ...s, status: token && store.sync?.gistId ? s.status : 'off' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced auto-push on every change (if connected)
  useEffect(() => {
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    const token = localStorage.getItem(TOKEN_KEY)
    const gistId = store.sync?.gistId
    if (!token || !gistId || !store.updatedAt) return
    clearTimeout(pushTimer.current)
    setSync((s) => ({ ...s, status: 'pending' }))
    pushTimer.current = setTimeout(async () => {
      setSync((s) => ({ ...s, status: 'syncing' }))
      try {
        await pushGist(token, gistId, store)
        setSync({ status: 'synced', lastSynced: new Date(), error: null })
      } catch (e) {
        setSync({ status: 'error', lastSynced: null, error: e.message })
      }
    }, 1500)
    return () => clearTimeout(pushTimer.current)
  }, [store])

  // Merge base course data with user timing overrides
  const courses = useMemo(
    () =>
      COURSES.map((c) =>
        store.courseOverrides[c.code] ? { ...c, ...store.courseOverrides[c.code] } : c
      ),
    [store.courseOverrides]
  )
  const courseMap = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.code, c])),
    [courses]
  )

  const activePlan =
    store.plans.find((p) => p.id === store.activePlanId) || store.plans[0]

  const updatePlan = (planId, updater) =>
    setStore((s) => ({
      ...s,
      plans: s.plans.map((p) => (p.id === planId ? updater(structuredClone(p)) : p)),
    }))

  const setOverride = (code, patch) =>
    setStore((s) => ({
      ...s,
      courseOverrides: {
        ...s.courseOverrides,
        [code]: { ...(s.courseOverrides[code] || {}), ...patch },
      },
    }))

  const clearOverride = (code) =>
    setStore((s) => {
      const next = { ...s.courseOverrides }
      delete next[code]
      return { ...s, courseOverrides: next }
    })

  const syncBadge = {
    off: null,
    pending: '● unsaved',
    syncing: '↻ syncing…',
    synced: '✓ synced',
    error: '⚠ sync error',
  }[sync.status]

  return (
    <div className="shell">
      <header className="masthead">
        <h1>
          After Six<span className="tick"> ·</span> MComp AI Planner
        </h1>
        <span className="sub">NUS SoC · part-time · Aug 2026 – Dec 2028</span>
        <span className="clock">
          {syncBadge && (
            <span
              className={'sync-badge ' + sync.status}
              title={sync.error || (sync.lastSynced ? `Last synced ${sync.lastSynced.toLocaleTimeString()}` : '')}
            >
              {syncBadge}
            </span>
          )}
          CLASSES FROM 18:30
        </span>
      </header>

      <nav className="tabs" aria-label="Sections">
        {[
          ['planner', 'Planner'],
          ['catalog', 'Catalog'],
          ['data', 'Data & sync'],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      <div className="note">
        Timings are from the <b>AY2025/26</b> SoC schedule, used as a proxy. The AY2026/27
        schedule publishes before <b>CourseReg Round 1 · 20 Jul 2026, 09:00</b> — verify each
        course on NUSMods, then correct any timing via the course page (Catalog → course →
        Edit timings).
      </div>

      {tab === 'planner' && (
        <Planner
          store={store}
          setStore={setStore}
          activePlan={activePlan}
          updatePlan={updatePlan}
          courses={courses}
          courseMap={courseMap}
          openCourse={setDrawerCode}
        />
      )}
      {tab === 'catalog' && (
        <Catalog
          courses={courses}
          activePlan={activePlan}
          updatePlan={updatePlan}
          openCourse={setDrawerCode}
          semesters={SEMESTERS}
        />
      )}
      {tab === 'data' && (
        <DataTab
          store={store}
          setStore={setStore}
          adoptRemote={adoptRemote}
          sync={sync}
          setSync={setSync}
          doPull={doPull}
        />
      )}

      {drawerCode && (
        <CourseDrawer
          course={courseMap[drawerCode]}
          hasOverride={!!store.courseOverrides[drawerCode]}
          onSaveOverride={(patch) => setOverride(drawerCode, patch)}
          onClearOverride={() => clearOverride(drawerCode)}
          onClose={() => setDrawerCode(null)}
        />
      )}
    </div>
  )
}
