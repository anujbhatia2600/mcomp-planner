// ─────────────────────────────────────────────────────────────
// Pulls live timetable data straight from the NUSMods v2 API.
// This runs in the user's real browser (not a sandboxed fetcher),
// and api.nusmods.com serves CORS-open JSON specifically for this
// kind of client-side use — no scraping needed, no server required.
// ─────────────────────────────────────────────────────────────

const DAY_MAP = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

const hhmm = (t) => (t && t.length === 4 ? `${t.slice(0, 2)}:${t.slice(2)}` : t)

// Pick the lesson that best represents "when this course meets": prefer an
// actual Lecture/Seminar type over Tutorial/Lab, since that's the fixed
// weekly slot; grad seminar-style modules often only have one lesson type.
const LESSON_PRIORITY = [
  'Lecture',
  'Seminar-Style Module Class',
  'Sectional Teaching',
  'Recitation',
  'Tutorial',
  'Tutorial Type 2',
  'Laboratory',
  'Design Lecture',
]

function pickRepresentativeLesson(timetable) {
  if (!timetable || timetable.length === 0) return null
  for (const type of LESSON_PRIORITY) {
    const found = timetable.find((l) => l.lessonType === type)
    if (found) return found
  }
  return timetable[0]
}

/**
 * Fetch one course's live data for a given academic year.
 * Returns { found: true, offerings, examInfo, raw } or { found: false }.
 */
export async function fetchCourseTimings(code, acadYear) {
  const url = `https://api.nusmods.com/v2/${acadYear}/modules/${code}.json`
  const res = await fetch(url)
  if (!res.ok) return { found: false, status: res.status }
  const data = await res.json()

  const offerings = []
  const examInfo = []
  for (const sd of data.semesterData || []) {
    const lesson = pickRepresentativeLesson(sd.timetable)
    if (lesson) {
      offerings.push({
        sem: sd.semester,
        day: DAY_MAP[lesson.day] || lesson.day,
        start: hhmm(lesson.startTime),
        end: hhmm(lesson.endTime),
        lessonType: lesson.lessonType,
        venue: lesson.venue,
      })
    }
    if (sd.examDate) {
      examInfo.push({ sem: sd.semester, examDate: sd.examDate, examDuration: sd.examDuration })
    }
  }

  return {
    found: true,
    offerings,
    examInfo,
    title: data.title,
    moduleCredit: data.moduleCredit,
  }
}

/**
 * Sync every course against live NUSMods data. Calls onProgress(done, total)
 * as it goes. Returns a report: { updates: [{code, before, after}], unchanged: [],
 * notFound: [], errors: [{code, message}] }.
 */
export async function syncAllCourses(courses, acadYear, currentOfferingsByCode, onProgress) {
  const updates = []
  const unchanged = []
  const notFound = []
  const errors = []

  const syncable = courses.filter((c) => !c.dissertation)
  for (let i = 0; i < syncable.length; i++) {
    const course = syncable[i]
    try {
      const result = await fetchCourseTimings(course.code, acadYear)
      if (!result.found) {
        notFound.push({ code: course.code, status: result.status })
      } else if (result.offerings.length === 0) {
        notFound.push({ code: course.code, status: 'no lessons in current data' })
      } else {
        const before = currentOfferingsByCode[course.code] || []
        const changed = JSON.stringify(before) !== JSON.stringify(result.offerings)
        if (changed) {
          updates.push({ code: course.code, before, after: result.offerings })
        } else {
          unchanged.push(course.code)
        }
      }
    } catch (e) {
      errors.push({ code: course.code, message: e.message })
    }
    onProgress?.(i + 1, syncable.length)
    // be polite to the API — small delay between requests
    await new Promise((r) => setTimeout(r, 120))
  }

  return { updates, unchanged, notFound, errors }
}
