import { SEMESTERS, RULES, SUB_AREAS } from '../data/courses.js'

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const overlaps = (a, b) =>
  a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end)

const semIndex = (id) => SEMESTERS.findIndex((s) => s.id === id) + 1 // 1-based

export function offeringFor(course, semType) {
  return (course.offerings || []).find((o) => o.sem === semType) || null
}

export function dissertationSemesters(plan) {
  if (plan.mode !== 'dissertation' || !plan.dissertationStart) return []
  const i = SEMESTERS.findIndex((s) => s.id === plan.dissertationStart)
  if (i < 0) return []
  return SEMESTERS.slice(i, i + 2).map((s) => s.id)
}

/**
 * Validate a plan. Returns { errors: [], warnings: [], info: [], stats }.
 * plan: { mode, dissertationStart, semesters: { S1: [codes], ... } }
 * courseMap: { code -> course }
 */
export function validatePlan(plan, courseMap) {
  const errors = []
  const warnings = []
  const info = []

  const dissSems = dissertationSemesters(plan)
  const allCodes = Object.values(plan.semesters).flat()
  const req = plan.mode === 'dissertation' ? RULES.dissertation : RULES.coursework

  // ── duplicates ──
  const seen = new Set()
  for (const c of allCodes) {
    if (seen.has(c)) errors.push(`${c} appears in more than one semester.`)
    seen.add(c)
  }

  // ── per-semester checks ──
  const semStats = {}
  for (const sem of SEMESTERS) {
    const codes = plan.semesters[sem.id] || []
    const courses = codes.map((c) => courseMap[c]).filter(Boolean)
    let units = courses.reduce((u, c) => u + c.units, 0)
    const hasDiss = dissSems.includes(sem.id)
    if (hasDiss) units += 8 // CP5101 counts 8 units per semester

    // offered in this semester type?
    const offs = []
    for (const c of courses) {
      const off = offeringFor(c, sem.type)
      if (!off) {
        errors.push(
          `${c.code} is not offered in ${sem.label} (${sem.term}) — it runs in Semester ${sem.type === 1 ? 2 : 1} only (per AY25/26 schedule).`
        )
      } else {
        offs.push({ code: c.code, ...off })
        if (toMin(off.start) < 18 * 60) {
          warnings.push(
            `${c.code} in ${sem.label} starts at ${off.start} — before your 6pm constraint.`
          )
        }
      }
    }

    // clashes
    for (let i = 0; i < offs.length; i++)
      for (let j = i + 1; j < offs.length; j++)
        if (overlaps(offs[i], offs[j]))
          errors.push(
            `Timetable clash in ${sem.label}: ${offs[i].code} and ${offs[j].code} both meet ${offs[i].day} evening.`
          )

    // workload band (only flag semesters that have anything planned,
    // or that fall inside the dissertation span)
    if (units > 0 || hasDiss) {
      if (units < RULES.minUnitsPerSem)
        warnings.push(
          `${sem.label} has ${units} units — below the part-time minimum of ${RULES.minUnitsPerSem}.`
        )
      if (units > RULES.maxUnitsPerSem)
        errors.push(
          `${sem.label} has ${units} units — above the part-time maximum of ${RULES.maxUnitsPerSem}.`
        )
    }
    semStats[sem.id] = { units, hasDiss, codes }
  }

  // ── preclusions (anywhere in plan) ──
  const preclusionPairs = new Set()
  for (const code of allCodes) {
    const c = courseMap[code]
    if (!c) continue
    for (const p of c.precludes || []) {
      if (allCodes.includes(p)) preclusionPairs.add([code, p].sort().join(' + '))
    }
  }
  for (const pair of preclusionPairs)
    errors.push(`${pair} are precluded — you cannot count both.`)

  // ── prerequisites ordering ──
  for (const sem of SEMESTERS) {
    for (const code of plan.semesters[sem.id] || []) {
      const c = courseMap[code]
      for (const pre of c?.prereq || []) {
        const preSem = SEMESTERS.find((s) => (plan.semesters[s.id] || []).includes(pre))
        if (!preSem) {
          warnings.push(`${code} builds on ${pre}, which is not in the plan.`)
        } else if (semIndex(preSem.id) >= semIndex(sem.id)) {
          warnings.push(`${code} (${sem.label}) should come after ${pre} (${preSem.label}).`)
        }
      }
    }
  }

  // ── 4000-level cap ──
  const l4 = allCodes.filter((c) => courseMap[c]?.level === 4000)
  if (l4.length > RULES.maxLevel4000)
    errors.push(
      `${l4.length} level-4000 courses (${l4.join(', ')}) — maximum is ${RULES.maxLevel4000} in the entire candidature.`
    )

  // ── essentials & sub-area coverage ──
  const essentials = allCodes.filter((c) => courseMap[c]?.essential)
  const areas = new Set(essentials.map((c) => courseMap[c].essential))
  if (essentials.length < req.essentials)
    warnings.push(
      `${essentials.length}/${req.essentials} essential courses planned (${plan.mode} option needs ${req.essentials}).`
    )
  if (areas.size < req.subAreas)
    warnings.push(
      `Essentials cover ${areas.size}/${req.subAreas} required sub-areas. Missing: ${Object.keys(SUB_AREAS)
        .filter((k) => !areas.has(Number(k)))
        .map((k) => SUB_AREAS[k].name)
        .join(', ')}.`
    )

  // ── dissertation rules ──
  if (plan.mode === 'dissertation') {
    if (!plan.dissertationStart) {
      warnings.push('Dissertation start semester not set — CP5101 spans two consecutive semesters.')
    } else {
      const start = semIndex(plan.dissertationStart)
      if (start < RULES.dissertationEarliestStart)
        errors.push('Part-time students can only start the dissertation from Semester 2 onwards.')
      if (start > RULES.dissertationLatestStart)
        errors.push('Dissertation must be registered no later than Week 1 of Semester 3.')
      if (start + 1 > SEMESTERS.length)
        errors.push('Dissertation spans two semesters — it cannot start in your final semester.')
      const startStats = semStats[plan.dissertationStart]
      const courseworkUnits = (startStats?.codes || []).reduce(
        (u, c) => u + (courseMap[c]?.units || 0),
        0
      )
      if (courseworkUnits < 4)
        warnings.push(
          `In ${plan.dissertationStart} (dissertation application semester) you need ≥4 units of coursework alongside CP5101 — currently ${courseworkUnits}.`
        )
      info.push('Reminder: finalise topic and advisor, then register CP5101 via mySoC → MComp in AI → Curriculum Matters → Dissertation.')
    }
  }

  // ── total units ──
  const totalUnits =
    allCodes.reduce((u, c) => u + (courseMap[c]?.units || 0), 0) + (dissSems.length ? 16 : 0)
  if (totalUnits < RULES.totalUnits)
    warnings.push(`${totalUnits}/${RULES.totalUnits} units planned — ${RULES.totalUnits - totalUnits} to go.`)
  if (totalUnits > RULES.totalUnits)
    info.push(`${totalUnits} units planned — more than the ${RULES.totalUnits} required. That's allowed but costs time/fees.`)

  return {
    errors,
    warnings,
    info,
    stats: {
      totalUnits,
      essentials: essentials.length,
      essentialsNeeded: req.essentials,
      areasCovered: [...areas],
      subAreasNeeded: req.subAreas,
      level4000: l4.length,
      semStats,
    },
  }
}
