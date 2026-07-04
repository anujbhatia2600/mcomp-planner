import { useEffect, useMemo, useState } from 'react'
import { COURSES, SEED_PLANS, SEMESTERS } from './data/courses.js'
import Planner from './components/Planner.jsx'
import Catalog from './components/Catalog.jsx'
import CourseDrawer from './components/CourseDrawer.jsx'
import DataTab from './components/DataTab.jsx'

const STORE_KEY = 'mcomp-planner-v1'

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Could not read saved data:', e)
  }
  return {
    plans: structuredClone(SEED_PLANS),
    activePlanId: SEED_PLANS[0].id,
    courseOverrides: {}, // { CODE: { offerings: [...] } }
  }
}

export default function App() {
  const [store, setStore] = useState(loadStore)
  const [tab, setTab] = useState('planner')
  const [drawerCode, setDrawerCode] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(store))
    } catch (e) {
      console.error('Could not save:', e)
    }
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

  return (
    <div className="shell">
      <header className="masthead">
        <h1>
          After Six<span className="tick"> ·</span> MComp AI Planner
        </h1>
        <span className="sub">NUS SoC · part-time · Aug 2026 – Dec 2028</span>
        <span className="clock">CLASSES FROM 18:30</span>
      </header>

      <nav className="tabs" aria-label="Sections">
        {[
          ['planner', 'Planner'],
          ['catalog', 'Catalog'],
          ['data', 'Data'],
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
      {tab === 'data' && <DataTab store={store} setStore={setStore} loadDefaults={loadStore} />}

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
