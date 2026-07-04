import { useMemo } from 'react'
import { SEMESTERS, SUB_AREAS, RULES } from '../data/courses.js'
import { validatePlan, offeringFor, dissertationSemesters } from '../lib/validate.js'

export default function Planner({
  store,
  setStore,
  activePlan,
  updatePlan,
  courses,
  courseMap,
  openCourse,
}) {
  const result = useMemo(
    () => validatePlan(activePlan, courseMap),
    [activePlan, courseMap]
  )
  const dissSems = dissertationSemesters(activePlan)

  const addCourse = (semId, code) => {
    if (!code) return
    updatePlan(activePlan.id, (p) => {
      p.semesters[semId] = [...(p.semesters[semId] || []), code]
      return p
    })
  }
  const removeCourse = (semId, code) =>
    updatePlan(activePlan.id, (p) => {
      p.semesters[semId] = p.semesters[semId].filter((c) => c !== code)
      return p
    })

  const setMode = (mode) =>
    updatePlan(activePlan.id, (p) => {
      p.mode = mode
      if (mode === 'coursework') p.dissertationStart = null
      else if (!p.dissertationStart) p.dissertationStart = 'S3'
      return p
    })

  const newPlan = () => {
    const id = 'plan-' + Date.now()
    setStore((s) => ({
      ...s,
      plans: [
        ...s.plans,
        {
          id,
          name: 'New plan',
          mode: 'coursework',
          dissertationStart: null,
          semesters: Object.fromEntries(SEMESTERS.map((x) => [x.id, []])),
        },
      ],
      activePlanId: id,
    }))
  }
  const duplicatePlan = () => {
    const id = 'plan-' + Date.now()
    setStore((s) => ({
      ...s,
      plans: [
        ...s.plans,
        { ...structuredClone(activePlan), id, name: activePlan.name + ' (copy)' },
      ],
      activePlanId: id,
    }))
  }
  const deletePlan = () => {
    if (store.plans.length <= 1) return
    if (!confirm(`Delete plan "${activePlan.name}"? This can't be undone.`)) return
    setStore((s) => {
      const plans = s.plans.filter((p) => p.id !== activePlan.id)
      return { ...s, plans, activePlanId: plans[0].id }
    })
  }
  const renamePlan = () => {
    const name = prompt('Plan name:', activePlan.name)
    if (name) updatePlan(activePlan.id, (p) => ({ ...p, name }))
  }

  const planned = new Set(Object.values(activePlan.semesters).flat())

  return (
    <>
      <div className="plan-toolbar">
        <select
          value={activePlan.id}
          onChange={(e) => setStore((s) => ({ ...s, activePlanId: e.target.value }))}
          aria-label="Active plan"
        >
          {store.plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={activePlan.mode} onChange={(e) => setMode(e.target.value)} aria-label="Degree option">
          <option value="coursework">Coursework option (10 courses)</option>
          <option value="dissertation">Dissertation option (6 courses + CP5101)</option>
        </select>
        {activePlan.mode === 'dissertation' && (
          <select
            value={activePlan.dissertationStart || 'S3'}
            onChange={(e) =>
              updatePlan(activePlan.id, (p) => ({ ...p, dissertationStart: e.target.value }))
            }
            aria-label="Dissertation start semester"
          >
            <option value="S2">CP5101 spans S2 + S3</option>
            <option value="S3">CP5101 spans S3 + S4</option>
          </select>
        )}
        <span className="grow" />
        <button className="btn" onClick={renamePlan}>Rename</button>
        <button className="btn" onClick={duplicatePlan}>Duplicate</button>
        <button className="btn" onClick={newPlan}>New plan</button>
        <button className="btn warn" onClick={deletePlan} disabled={store.plans.length <= 1}>
          Delete
        </button>
      </div>

      <div className="board">
        {SEMESTERS.map((sem) => {
          const codes = activePlan.semesters[sem.id] || []
          const hasDiss = dissSems.includes(sem.id)
          const units = codes.reduce((u, c) => u + (courseMap[c]?.units || 0), 0) + (hasDiss ? 8 : 0)
          const eligible = courses.filter(
            (c) =>
              !c.dissertation &&
              c.evening &&
              !planned.has(c.code) &&
              offeringFor(c, sem.type)
          )
          return (
            <div className="sem" key={sem.id}>
              <header>
                <h3>{sem.label}</h3>
                <span className="term">{sem.term}</span>
              </header>

              {hasDiss && (
                <div className="chip diss">
                  <span className="code">
                    CP5101 <span className="slot">8 u</span>
                  </span>
                  <div className="cname">Dissertation (part {sem.id === dissSems[0] ? '1' : '2'} of 2)</div>
                </div>
              )}

              {codes.map((code) => {
                const c = courseMap[code]
                if (!c) return null
                const off = offeringFor(c, sem.type)
                const accent = c.essential ? SUB_AREAS[c.essential].color : 'var(--faint)'
                return (
                  <div
                    className="chip"
                    key={code}
                    style={{ '--chip-accent': accent }}
                  >
                    <span className="code">
                      <button
                        className="x"
                        title={`Remove ${code} from ${sem.label}`}
                        onClick={() => removeCourse(sem.id, code)}
                      >
                        ✕
                      </button>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          openCourse(code)
                        }}
                        style={{ color: 'inherit' }}
                      >
                        {code}
                      </a>{' '}
                      <span className="slot">{off ? `${off.day} ${off.start}` : 'not offered'}</span>
                    </span>
                    <div className="cname">{c.name}</div>
                  </div>
                )
              })}

              <div className="addrow">
                <select
                  value=""
                  onChange={(e) => addCourse(sem.id, e.target.value)}
                  aria-label={`Add course to ${sem.label}`}
                >
                  <option value="">+ Add course…</option>
                  {eligible.map((c) => {
                    const off = offeringFor(c, sem.type)
                    return (
                      <option key={c.code} value={c.code}>
                        {c.code} · {off.day} {off.start} · {c.name}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="units">
                <span className={units > RULES.maxUnitsPerSem ? 'over' : units > 0 && units < RULES.minUnitsPerSem ? 'under' : ''}>
                  {units} units
                </span>{' '}
                · band {RULES.minUnitsPerSem}–{RULES.maxUnitsPerSem}
              </div>
            </div>
          )
        })}
      </div>

      <div className="audit-grid">
        <div className="panel">
          <h2>Degree audit</h2>
          {result.errors.length === 0 && result.warnings.length === 0 && (
            <div className="audit-item ok">
              <span className="dot" />
              <span>All checks pass. This plan graduates you under the {activePlan.mode} option.</span>
            </div>
          )}
          {result.errors.map((m, i) => (
            <div className="audit-item err" key={'e' + i}>
              <span className="dot" />
              <span>{m}</span>
            </div>
          ))}
          {result.warnings.map((m, i) => (
            <div className="audit-item warn" key={'w' + i}>
              <span className="dot" />
              <span>{m}</span>
            </div>
          ))}
          {result.info.map((m, i) => (
            <div className="audit-item info" key={'i' + i}>
              <span className="dot" />
              <span>{m}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <h2>Progress</h2>
          <Meter label="Units" value={result.stats.totalUnits} max={RULES.totalUnits} />
          <Meter
            label="Essential courses"
            value={result.stats.essentials}
            max={result.stats.essentialsNeeded}
          />
          <Meter
            label="Level-4000 used"
            value={result.stats.level4000}
            max={RULES.maxLevel4000}
            neutral
          />
          <h2 style={{ marginTop: 16 }}>Sub-areas covered</h2>
          <div className="sa-chips">
            {Object.entries(SUB_AREAS).map(([k, sa]) => {
              const on = result.stats.areasCovered.includes(Number(k))
              return (
                <span
                  key={k}
                  className={'sa-chip' + (on ? ' on' : '')}
                  style={on ? { background: sa.color } : {}}
                >
                  {k} · {sa.name}
                </span>
              )
            })}
          </div>
          <p className="dim" style={{ fontSize: 12, marginTop: 8 }}>
            Need ≥{result.stats.subAreasNeeded} of 4 across your essentials.
          </p>
        </div>
      </div>
    </>
  )
}

function Meter({ label, value, max, neutral }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="meter">
      <div className="lbl">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="bar">
        <div
          className={'fill' + (!neutral && value >= max ? ' done' : '')}
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  )
}
