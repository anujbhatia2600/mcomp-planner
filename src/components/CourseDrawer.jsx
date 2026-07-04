import { useEffect, useState } from 'react'
import { SUB_AREAS, LOADS, nusmodsUrl, nusmodsApiUrl } from '../data/courses.js'

const ACAD_YEARS = ['2026-2027', '2025-2026'] // try newest first, fall back

// NUSMods workload array = [lecture, tutorial, lab, project, preparation] h/wk
const WORKLOAD_LABELS = ['Lecture', 'Tutorial', 'Lab', 'Project work', 'Self-study']

export default function CourseDrawer({
  course,
  hasOverride,
  onSaveOverride,
  onClearOverride,
  onClose,
}) {
  const [mods, setMods] = useState({ state: 'loading', data: null, year: null })
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(course.offerings)

  useEffect(() => {
    setDraft(course.offerings)
    setEditing(false)
  }, [course])

  useEffect(() => {
    let cancelled = false
    async function fetchMods() {
      setMods({ state: 'loading', data: null, year: null })
      for (const year of ACAD_YEARS) {
        try {
          const res = await fetch(nusmodsApiUrl(course.code, year))
          if (res.ok) {
            const data = await res.json()
            if (!cancelled) setMods({ state: 'ok', data, year })
            return
          }
        } catch {
          /* try next year */
        }
      }
      if (!cancelled) setMods({ state: 'error', data: null, year: null })
    }
    if (!course.dissertation) fetchMods()
    else setMods({ state: 'na', data: null, year: null })
    return () => {
      cancelled = true
    }
  }, [course])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sa = course.essential ? SUB_AREAS[course.essential] : null
  const d = mods.data

  const saveDraft = () => {
    onSaveOverride({ offerings: draft, evening: draft.some((o) => Number(o.start.split(':')[0]) >= 18) })
    setEditing(false)
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer" role="dialog" aria-label={`${course.code} details`}>
        <button className="close" onClick={onClose}>
          Close ✕
        </button>
        <div className="code-big">{course.code}</div>
        <h2>{course.name}</h2>

        <section>
          <div className="kv">
            <dt>Units</dt>
            <dd>{course.units}</dd>
            <dt>Level</dt>
            <dd>{course.level}</dd>
            <dt>Role</dt>
            <dd>
              {sa ? (
                <span className="tag sa" style={{ background: sa.color }}>
                  Essential · Sub-Area {course.essential}: {sa.name}
                </span>
              ) : course.dissertation ? (
                'Dissertation'
              ) : (
                'Elective (CS/IS 4000–6000)'
              )}
            </dd>
            <dt>Load</dt>
            <dd>
              <span className={'load-' + LOADS[course.load].rank}>{LOADS[course.load].label}</span>
              <span className="dim"> — {course.loadNote}</span>
            </dd>
            {course.precludes?.length > 0 && (
              <>
                <dt>Precluded with</dt>
                <dd>{course.precludes.join(', ')}</dd>
              </>
            )}
            {course.prereq?.length > 0 && (
              <>
                <dt>Take after</dt>
                <dd>{course.prereq.join(', ')}</dd>
              </>
            )}
          </div>
        </section>

        <section>
          <h4>
            Evening slots (AY25/26 proxy){' '}
            {hasOverride && <span className="tag">edited by you</span>}
          </h4>
          {!editing && (
            <>
              {course.offerings.length === 0 && <p className="dim">Not offered per current data.</p>}
              {course.offerings.map((o, i) => (
                <p className="mono" key={i}>
                  Semester {o.sem} · {o.day} {o.start}–{o.end}
                </p>
              ))}
              <div className="data-actions">
                <button className="btn" onClick={() => setEditing(true)}>
                  Edit timings
                </button>
                {hasOverride && (
                  <button className="btn" onClick={onClearOverride}>
                    Reset to built-in data
                  </button>
                )}
              </div>
            </>
          )}
          {editing && (
            <>
              {draft.map((o, i) => (
                <div className="offer-edit" key={i}>
                  <select
                    value={o.sem}
                    onChange={(e) =>
                      setDraft(draft.map((x, j) => (j === i ? { ...x, sem: Number(e.target.value) } : x)))
                    }
                  >
                    <option value={1}>Sem 1</option>
                    <option value={2}>Sem 2</option>
                  </select>
                  <select
                    value={o.day}
                    onChange={(e) =>
                      setDraft(draft.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)))
                    }
                  >
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <option key={day}>{day}</option>
                    ))}
                  </select>
                  <input
                    style={{ width: 80 }}
                    value={o.start}
                    onChange={(e) =>
                      setDraft(draft.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))
                    }
                    aria-label="Start time"
                  />
                  <span className="dim">–</span>
                  <input
                    style={{ width: 80 }}
                    value={o.end}
                    onChange={(e) =>
                      setDraft(draft.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))
                    }
                    aria-label="End time"
                  />
                  <button className="btn warn" onClick={() => setDraft(draft.filter((_, j) => j !== i))}>
                    ✕
                  </button>
                </div>
              ))}
              <div className="data-actions">
                <button
                  className="btn"
                  onClick={() => setDraft([...draft, { sem: 1, day: 'Mon', start: '18:30', end: '20:30' }])}
                >
                  + Add slot
                </button>
                <button className="btn primary" onClick={saveDraft}>
                  Save timings
                </button>
                <button className="btn" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>

        <section>
          <h4>Live from NUSMods {mods.year ? `(AY${mods.year})` : ''}</h4>
          {mods.state === 'loading' && <p className="spin">Fetching course info…</p>}
          {mods.state === 'error' && (
            <p className="dim">
              Couldn't reach the NUSMods API (offline?). Open the course page directly:{' '}
              <a href={nusmodsUrl(course.code)} target="_blank" rel="noreferrer">
                {nusmodsUrl(course.code)} ↗
              </a>
            </p>
          )}
          {mods.state === 'na' && (
            <p className="dim">
              CP5101 is registered through the mySoC portal, not CourseReg — see the Dissertation
              form under Curriculum Matters.
            </p>
          )}
          {mods.state === 'ok' && d && (
            <>
              <p className="desc">{d.description}</p>
              <div className="kv" style={{ marginTop: 10 }}>
                <dt>Department</dt>
                <dd>{d.department}</dd>
                <dt>Credits</dt>
                <dd>{d.moduleCredit} units</dd>
                {d.prerequisite && (
                  <>
                    <dt>Prerequisite</dt>
                    <dd className="dim">{d.prerequisite} (not enforced for MComp in AI students)</dd>
                  </>
                )}
                {d.preclusion && (
                  <>
                    <dt>Preclusion</dt>
                    <dd className="dim">{d.preclusion}</dd>
                  </>
                )}
                {Array.isArray(d.workload) && (
                  <>
                    <dt>Weekly structure</dt>
                    <dd>
                      {d.workload
                        .map((h, i) => (h ? `${WORKLOAD_LABELS[i]} ${h}h` : null))
                        .filter(Boolean)
                        .join(' · ')}
                    </dd>
                  </>
                )}
                {(d.semesterData || []).map((s) => (
                  <SemExam key={s.semester} s={s} />
                ))}
              </div>
              <p className="dim" style={{ fontSize: 12, marginTop: 10 }}>
                Assessment weightings (CA/exam split) aren't in the NUSMods API — check the
                syllabus on the course page or Canvas in Week 1:{' '}
                <a href={nusmodsUrl(course.code)} target="_blank" rel="noreferrer">
                  full NUSMods page ↗
                </a>
              </p>
            </>
          )}
        </section>
      </aside>
    </div>
  )
}

function SemExam({ s }) {
  return (
    <>
      <dt>Sem {s.semester} exam</dt>
      <dd>
        {s.examDate
          ? `${new Date(s.examDate).toLocaleString('en-SG', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })} (${(s.examDuration || 0) / 60}h)`
          : 'No final exam listed'}
      </dd>
    </>
  )
}
