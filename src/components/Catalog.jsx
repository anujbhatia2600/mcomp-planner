import { useMemo, useState } from 'react'
import { SUB_AREAS, LOADS, nusmodsUrl } from '../data/courses.js'
import { offeringFor } from '../lib/validate.js'

export default function Catalog({ courses, activePlan, updatePlan, openCourse, semesters }) {
  const [q, setQ] = useState('')
  const [semFilter, setSemFilter] = useState('all') // all | 1 | 2
  const [dayFilter, setDayFilter] = useState('all')
  const [loadFilter, setLoadFilter] = useState('all')
  const [essentialOnly, setEssentialOnly] = useState(false)
  const [eveningOnly, setEveningOnly] = useState(true)

  const planned = new Set(Object.values(activePlan.semesters).flat())

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return courses
      .filter((c) => !c.dissertation)
      .filter((c) => !eveningOnly || c.evening)
      .filter((c) => !essentialOnly || c.essential)
      .filter(
        (c) =>
          semFilter === 'all' ||
          c.offerings.some((o) => o.sem === Number(semFilter))
      )
      .filter(
        (c) => dayFilter === 'all' || c.offerings.some((o) => o.day === dayFilter)
      )
      .filter((c) => loadFilter === 'all' || c.load === loadFilter)
      .filter(
        (c) =>
          !needle ||
          c.code.toLowerCase().includes(needle) ||
          c.name.toLowerCase().includes(needle)
      )
      .sort((a, b) => (b.essential ? 1 : 0) - (a.essential ? 1 : 0) || a.code.localeCompare(b.code))
  }, [courses, q, semFilter, dayFilter, loadFilter, essentialOnly, eveningOnly])

  const addTo = (code, semId) => {
    if (!semId) return
    updatePlan(activePlan.id, (p) => {
      if (!p.semesters[semId].includes(code)) p.semesters[semId].push(code)
      return p
    })
  }

  return (
    <>
      <div className="filters">
        <input
          type="search"
          placeholder="Search code or name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search courses"
        />
        <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)} aria-label="Semester">
          <option value="all">Any semester</option>
          <option value="1">Sem 1 (Aug)</option>
          <option value="2">Sem 2 (Jan)</option>
        </select>
        <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} aria-label="Day">
          <option value="all">Any day</option>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select value={loadFilter} onChange={(e) => setLoadFilter(e.target.value)} aria-label="Load">
          <option value="all">Any load</option>
          {Object.entries(LOADS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={essentialOnly}
            onChange={(e) => setEssentialOnly(e.target.checked)}
          />
          Essentials only
        </label>
        <label>
          <input
            type="checkbox"
            checked={eveningOnly}
            onChange={(e) => setEveningOnly(e.target.checked)}
          />
          After 6pm only
        </label>
      </div>

      <div className="panel" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="cat-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Sub-area</th>
              <th>Slots (AY25/26)</th>
              <th>Load</th>
              <th>Notes</th>
              <th>Links</th>
              <th>Add</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const sa = c.essential ? SUB_AREAS[c.essential] : null
              return (
                <tr key={c.code}>
                  <td>
                    <div className="code">
                      <button onClick={() => openCourse(c.code)} title="Open course details">
                        {c.code}
                      </button>
                      {planned.has(c.code) && (
                        <span className="tag" style={{ marginLeft: 6 }}>
                          in plan
                        </span>
                      )}
                      {!c.evening && (
                        <span className="tag no-eve" style={{ marginLeft: 6 }}>
                          no 6pm slot
                        </span>
                      )}
                    </div>
                    <div className="dim">{c.name}</div>
                  </td>
                  <td>
                    {sa ? (
                      <span className="tag sa" style={{ background: sa.color }}>
                        {c.essential} · {sa.name}
                      </span>
                    ) : (
                      <span className="dim">elective</span>
                    )}
                    {c.level === 4000 && (
                      <div>
                        <span className="tag" style={{ marginTop: 4 }}>
                          4000-cap
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="mono">
                    {c.offerings.length === 0 && <span className="dim">not offered</span>}
                    {c.offerings.map((o, i) => (
                      <div key={i}>
                        S{o.sem} · {o.day} {o.start}–{o.end}
                      </div>
                    ))}
                  </td>
                  <td>
                    <span className={'mono load-' + LOADS[c.load].rank}>
                      {LOADS[c.load].label}
                    </span>
                  </td>
                  <td className="dim" style={{ maxWidth: 260 }}>
                    {c.loadNote}
                    {c.precludes?.length > 0 && <div>Precluded: {c.precludes.join(', ')}</div>}
                    {c.prereq?.length > 0 && <div>After: {c.prereq.join(', ')}</div>}
                  </td>
                  <td>
                    <a href={nusmodsUrl(c.code)} target="_blank" rel="noreferrer">
                      NUSMods ↗
                    </a>
                  </td>
                  <td>
                    <select value="" onChange={(e) => addTo(c.code, e.target.value)} aria-label={`Add ${c.code} to a semester`}>
                      <option value="">＋ sem…</option>
                      {semesters
                        .filter((s) => offeringFor(c, s.type))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} · {s.term}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
